package screencast

import (
	"fmt"
	"os"
	"os/exec"
	"sync"
	"syscall"
	"time"

	"github.com/godbus/dbus/v5"
)

type StreamInfo struct {
	NodeID     uint32
	MediaType  uint32 
	Properties map[string]dbus.Variant
}

type ScreenCastService struct {
	conn          *dbus.Conn
	sessionHandle dbus.ObjectPath
	cmd           *exec.Cmd
	outputPath    string
	isPaused      bool

	mu       sync.Mutex 
	done     chan struct{}
	waitDone chan error
}

func NewScreenCastService(conn *dbus.Conn) *ScreenCastService {
	return &ScreenCastService{conn: conn}
}

func (s *ScreenCastService) StartRecording(outputPath string, captureMic bool, captureSystemAudio bool) error {
	_ = captureMic
	_ = captureSystemAudio
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.cmd != nil {
		return fmt.Errorf("recording already active")
	}

	portal := s.conn.Object("org.freedesktop.portal.Desktop", "/org/freedesktop/portal/desktop")

	sessionHandle, err := s.createSession(portal)
	if err != nil {
		return fmt.Errorf("CreateSession error: %w", err)
	}
	s.sessionHandle = sessionHandle

	if err := s.selectSources(portal, sessionHandle); err != nil {
		s.closeSession()
		return fmt.Errorf("SelectSources error: %w", err)
	}

	streams, err := s.startSession(portal, sessionHandle)
	if err != nil {
		s.closeSession()
		return fmt.Errorf("Start error: %w", err)
	}

	args, err := s.buildPipelineArgs(streams, outputPath)
	if err != nil {
		s.closeSession()
		return err
	}

	cmd := exec.Command("gst-launch-1.0", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		s.closeSession()
		return fmt.Errorf("failed to start gst-launch: %w", err)
	}

	s.cmd = cmd
	s.outputPath = outputPath
	s.isPaused = false
	s.done = make(chan struct{})
	s.waitDone = make(chan error, 1)

	go func() {
		waitErr := cmd.Wait()
		s.mu.Lock()

		select {
		case <-s.done:
			s.waitDone <- waitErr
			s.mu.Unlock()
		default:
			if waitErr != nil {
				fmt.Printf("gst-launch exited unexpectedly: %v\n", waitErr)
			}
			s.cmd = nil
			s.outputPath = ""
			s.done = nil
			s.waitDone = nil
			s.mu.Unlock()
			s.closeSession()
		}
	}()

	return nil
}

func (s *ScreenCastService) PauseRecording() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.cmd == nil || s.cmd.Process == nil {
		return fmt.Errorf("no active recording")
	}
	if s.isPaused {
		return nil
	}
	if err := s.cmd.Process.Signal(syscall.SIGSTOP); err != nil {
		return fmt.Errorf("pause failed: %w", err)
	}
	s.isPaused = true
	return nil
}

func (s *ScreenCastService) ResumeRecording() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.cmd == nil || s.cmd.Process == nil {
		return fmt.Errorf("no active recording")
	}
	if !s.isPaused {
		return nil
	}
	if err := s.cmd.Process.Signal(syscall.SIGCONT); err != nil {
		return fmt.Errorf("resume failed: %w", err)
	}
	s.isPaused = false
	return nil
}

func (s *ScreenCastService) StopRecording() (string, error) {
	s.mu.Lock()
	if s.cmd == nil || s.cmd.Process == nil {
		s.mu.Unlock()
		return "", fmt.Errorf("no active recording")
	}

	if s.isPaused {
		s.cmd.Process.Signal(syscall.SIGCONT)
		s.isPaused = false
		time.Sleep(100 * time.Millisecond)
	}

	if err := s.cmd.Process.Signal(os.Interrupt); err != nil {
		s.mu.Unlock()
		return "", fmt.Errorf("failed to send interrupt: %w", err)
	}

	if s.done != nil {
		select {
		case <-s.done:
		default:
			close(s.done)
		}
	}

	waitCh := s.waitDone
	path := s.outputPath
	s.mu.Unlock()

	var waitErr error
	select {
	case waitErr = <-waitCh:
	case <-time.After(5 * time.Second):
		s.mu.Lock()
		if s.cmd != nil && s.cmd.Process != nil {
			s.cmd.Process.Kill()
		}
		s.mu.Unlock()
		waitErr = <-waitCh
	}

	s.mu.Lock()
	s.cmd = nil
	s.outputPath = ""
	s.isPaused = false
	s.done = nil
	s.waitDone = nil
	s.mu.Unlock()

	s.closeSession()

	if waitErr != nil {
		return "", fmt.Errorf("gst-launch exited with error: %w", waitErr)
	}
	return path, nil
}

func (s *ScreenCastService) Cleanup() {
	s.mu.Lock()
	if s.cmd == nil {
		s.mu.Unlock()
		return
	}

	if s.cmd.Process != nil {
		s.cmd.Process.Kill()
	}

	if s.done != nil {
		select {
		case <-s.done:
		default:
			close(s.done)
		}
	}

	waitCh := s.waitDone
	s.mu.Unlock()

	if waitCh != nil {
		select {
		case <-waitCh:
		case <-time.After(2 * time.Second):
		}
	}

	s.mu.Lock()
	s.cmd = nil
	s.outputPath = ""
	s.isPaused = false
	s.done = nil
	s.waitDone = nil
	s.mu.Unlock()

	s.closeSession()
}


func (s *ScreenCastService) createSession(portal dbus.BusObject) (dbus.ObjectPath, error) {
	token := fmt.Sprintf("glowsnap_%d", time.Now().UnixNano())
	options := map[string]dbus.Variant{
		"handle_token":         dbus.MakeVariant(token),
		"session_handle_token": dbus.MakeVariant(token + "_session"),
		"persist_mode":         dbus.MakeVariant(uint32(2)),
	}

	call := portal.Call("org.freedesktop.portal.ScreenCast.CreateSession", 0, options)
	if call.Err != nil {
		return "", fmt.Errorf("CreateSession call failed: %w", call.Err)
	}

	var requestHandle dbus.ObjectPath
	if err := call.Store(&requestHandle); err != nil {
		return "", fmt.Errorf("failed to get request handle: %w", err)
	}

	resp, err := s.waitForResponse(requestHandle, 10*time.Second)
	if err != nil {
		return "", err
	}

	var responseCode uint32
	var results map[string]dbus.Variant
	if err := dbus.Store(resp.Body, &responseCode, &results); err != nil {
		return "", fmt.Errorf("invalid CreateSession response: %w", err)
	}
	if responseCode != 0 {
		return "", fmt.Errorf("CreateSession rejected with code %d", responseCode)
	}

	handleVar, ok := results["session_handle"]
	if !ok {
		return "", fmt.Errorf("missing session_handle in response")
	}
	handleStr, ok := handleVar.Value().(string)
	if !ok {
		return "", fmt.Errorf("invalid session_handle type")
	}
	return dbus.ObjectPath(handleStr), nil
}

func (s *ScreenCastService) selectSources(portal dbus.BusObject, sessionHandle dbus.ObjectPath) error {
	token := fmt.Sprintf("glowsnap_sel_%d", time.Now().UnixNano())
	selectOptions := map[string]dbus.Variant{
		"handle_token": dbus.MakeVariant(token),
		"types":        dbus.MakeVariant(uint32(1)),
		"multiple":     dbus.MakeVariant(false),
	}

	call := portal.Call("org.freedesktop.portal.ScreenCast.SelectSources", 0, sessionHandle, selectOptions)
	if call.Err != nil {
		return fmt.Errorf("SelectSources call failed: %w", call.Err)
	}

	var requestHandle dbus.ObjectPath
	if err := call.Store(&requestHandle); err != nil {
		return fmt.Errorf("failed to get request handle: %w", err)
	}

	resp, err := s.waitForResponse(requestHandle, 30*time.Second)
	if err != nil {
		return fmt.Errorf("SelectSources wait failed: %w", err)
	}

	var responseCode uint32
	var results map[string]dbus.Variant
	if err := dbus.Store(resp.Body, &responseCode, &results); err != nil {
		return fmt.Errorf("invalid SelectSources response: %w", err)
	}
	if responseCode != 0 {
		return fmt.Errorf("SelectSources rejected with code %d", responseCode)
	}
	return nil
}

func (s *ScreenCastService) startSession(portal dbus.BusObject, sessionHandle dbus.ObjectPath) ([]StreamInfo, error) {
	token := fmt.Sprintf("glowsnap_start_%d", time.Now().UnixNano())
	startOptions := map[string]dbus.Variant{
		"handle_token": dbus.MakeVariant(token),
	}

	call := portal.Call("org.freedesktop.portal.ScreenCast.Start", 0, sessionHandle, "", startOptions)
	if call.Err != nil {
		return nil, fmt.Errorf("Start call failed: %w", call.Err)
	}

	var requestHandle dbus.ObjectPath
	if err := call.Store(&requestHandle); err != nil {
		return nil, fmt.Errorf("failed to get request handle: %w", err)
	}

	resp, err := s.waitForResponse(requestHandle, 10*time.Second)
	if err != nil {
		return nil, fmt.Errorf("Start response wait failed: %w", err)
	}

	var responseCode uint32
	var results map[string]dbus.Variant
	if err := dbus.Store(resp.Body, &responseCode, &results); err != nil {
		return nil, fmt.Errorf("invalid Start response: %w", err)
	}
	if responseCode != 0 {
		return nil, fmt.Errorf("Start rejected with code %d", responseCode)
	}

	streamsVar, ok := results["streams"]
	if !ok {
		return nil, fmt.Errorf("no 'streams' in Start response")
	}
	return parseStreams(streamsVar)
}

func (s *ScreenCastService) closeSession() {
	if s.sessionHandle == "" {
		return
	}
	sessionObj := s.conn.Object("org.freedesktop.portal.Desktop", s.sessionHandle)
	call := sessionObj.Call("org.freedesktop.portal.Session.Close", 0)
	if call.Err != nil {
		fmt.Printf("Warning: failed to close portal session: %v\n", call.Err)
	}
	s.sessionHandle = ""
}


func (s *ScreenCastService) buildPipelineArgs(streams []StreamInfo, outputPath string) ([]string, error) {
	var videoNode uint32
	for _, st := range streams {
		if st.MediaType == 1 {
			videoNode = st.NodeID
			break
		}
	}
	if videoNode == 0 {
		return nil, fmt.Errorf("no video stream found")
	}

	args := []string{
		"-e",
		"pipewiresrc",
		fmt.Sprintf("path=%d", videoNode),
		"!",
		"videoconvert",
		"!",
		"vp8enc",
		"deadline=1",
		"cpu-used=8",
		"target-bitrate=5000000",
		"!",
		"webmmux",
		"!",
		"filesink",
		"location=" + outputPath,
	}
	return args, nil
}


func (s *ScreenCastService) waitForResponse(requestPath dbus.ObjectPath, timeout time.Duration) (*dbus.Signal, error) {
	matchRule := fmt.Sprintf("type='signal',interface='org.freedesktop.portal.Request',member='Response',path='%s'", requestPath)
	if err := s.addMatch(matchRule); err != nil {
		return nil, err
	}
	defer s.removeMatch(matchRule)

	signalCh := make(chan *dbus.Signal, 1)
	s.conn.Signal(signalCh)
	defer s.conn.RemoveSignal(signalCh)

	select {
	case sig := <-signalCh:
		return sig, nil
	case <-time.After(timeout):
		return nil, fmt.Errorf("timeout waiting for response")
	}
}

func (s *ScreenCastService) addMatch(rule string) error {
	return s.conn.BusObject().Call("org.freedesktop.DBus.AddMatch", 0, rule).Err
}

func (s *ScreenCastService) removeMatch(rule string) {
	s.conn.BusObject().Call("org.freedesktop.DBus.RemoveMatch", 0, rule)
}

func parseStreams(streamsVar dbus.Variant) ([]StreamInfo, error) {
	raw := streamsVar.Value()

	slice, ok := raw.([][]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected streams type %T", raw)
	}

	streams := make([]StreamInfo, 0, len(slice))

	for _, parts := range slice {
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid stream entry: %#v", parts)
		}

		nodeID, ok := parts[0].(uint32)
		if !ok {
			return nil, fmt.Errorf("invalid node id type %T", parts[0])
		}

		props, ok := parts[1].(map[string]dbus.Variant)
		if !ok {
			return nil, fmt.Errorf("invalid properties type %T", parts[1])
		}

		mediaType := uint32(1)
		if v, ok := props["media_type"]; ok {
			if t, ok := v.Value().(uint32); ok {
				mediaType = t
			}
		}

		streams = append(streams, StreamInfo{
			NodeID:     nodeID,
			MediaType:  mediaType,
			Properties: props,
		})
	}

	return streams, nil
}