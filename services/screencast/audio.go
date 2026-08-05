package screencast

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"
)

type AudioDevice struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type SystemAudioInfo struct {
	Supported bool   `json:"supported"`
	Message   string `json:"message"`
}

func GetSystemAudioInfo() SystemAudioInfo {
	supported, message := SystemAudioSupported()
	return SystemAudioInfo{Supported: supported, Message: message}
}

type pactlSource struct {
	Name        string
	Description string
	IsMonitor   bool
}

func pactlOutput(args ...string) ([]byte, error) {
	return exec.Command("pactl", args...).Output()
}

func setSourceMute(name string, muted bool) error {
	value := "0"
	if muted {
		value = "1"
	}
	cmd := exec.Command("pactl", "set-source-mute", name, value)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("pactl set-source-mute %s %s: %v (%s)", name, value, err, strings.TrimSpace(string(out)))
	}
	return nil
}

func listSources() ([]pactlSource, error) {
	out, err := pactlOutput("list", "sources")
	if err != nil {
		return nil, err
	}

	var sources []pactlSource
	var cur *pactlSource
	for _, line := range bytes.Split(out, []byte("\n")) {
		text := strings.TrimSpace(string(line))
		if strings.HasPrefix(text, "Source #") {
			if cur != nil {
				sources = append(sources, *cur)
			}
			cur = &pactlSource{}
			continue
		}
		if cur == nil {
			continue
		}
		if strings.HasPrefix(text, "Name:") {
			cur.Name = strings.TrimSpace(strings.TrimPrefix(text, "Name:"))
		} else if strings.HasPrefix(text, "Description:") {
			cur.Description = strings.TrimSpace(strings.TrimPrefix(text, "Description:"))
		}
	}
	if cur != nil {
		sources = append(sources, *cur)
	}

	for i := range sources {
		if strings.Contains(sources[i].Name, ".monitor") {
			sources[i].IsMonitor = true
		}
	}
	return sources, nil
}

func ListMicrophones() ([]AudioDevice, error) {
	sources, err := listSources()
	if err != nil {
		return nil, fmt.Errorf("unable to list audio sources: %w", err)
	}

	var mics []AudioDevice
	for _, s := range sources {
		if !s.IsMonitor {
			mics = append(mics, AudioDevice{Name: s.Name, Description: s.Description})
		}
	}
	if mics == nil {
		mics = []AudioDevice{}
	}
	return mics, nil
}

func DefaultMicrophone() string {
	out, err := pactlOutput("get-default-source")
	if err == nil {
		name := strings.TrimSpace(string(out))
		if name != "" && !strings.Contains(name, ".monitor") {
			return name
		}
	}

	mics, _ := ListMicrophones()
	if len(mics) > 0 {
		return mics[0].Name
	}
	return ""
}

func SystemAudioSupported() (bool, string) {
	if _, err := exec.LookPath("pactl"); err != nil {
		return false, "PulseAudio/PipeWire (pactl) is not available on this system."
	}
	device, err := SystemAudioDevice()
	if err != nil || device == "" {
		return false, "No desktop audio output device was found."
	}
	return true, ""
}

func SystemAudioDevice() (string, error) {
	out, err := pactlOutput("get-default-sink")
	if err != nil {
		return "", fmt.Errorf("unable to determine default output device: %w", err)
	}
	sink := strings.TrimSpace(string(out))
	if sink == "" {
		return "", fmt.Errorf("no default output device found")
	}

	monitor := sink + ".monitor"
	sources, err := listSources()
	if err != nil {
		return "", err
	}
	for _, s := range sources {
		if s.Name == monitor {
			return monitor, nil
		}
	}
	return "", fmt.Errorf("no monitor source available for the default output device")
}
