package screencast

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func fakeGstLaunchBinary(t *testing.T) string {
	t.Helper()
	bin := filepath.Join(t.TempDir(), "fake-gst-launch")
	script := "#!/bin/sh\nexec sleep 30\n"
	if err := os.WriteFile(bin, []byte(script), 0755); err != nil {
		t.Fatal(err)
	}
	return bin
}

func withFakeGstLaunch(t *testing.T) {
	t.Helper()
	original := gstLaunchBinary
	gstLaunchBinary = fakeGstLaunchBinary(t)
	t.Cleanup(func() { gstLaunchBinary = original })
}

func TestRecorderCanRestartAfterStop(t *testing.T) {
	withFakeGstLaunch(t)

	rec := NewGstLauncher()
	gst := rec.(*gstLauncher)

	opts := RecordingOptions{OutputPath: filepath.Join(t.TempDir(), "out.mp4")}

	if err := rec.Start(1, opts); err != nil {
		t.Fatalf("first Start failed: %v", err)
	}
	if !rec.IsRunning() {
		t.Fatal("expected recording to be running after Start")
	}

	if err := rec.Stop(); err != nil {
		if !strings.Contains(err.Error(), "interrupt") {
			t.Fatalf("Stop failed: %v", err)
		}
	}
	if rec.IsRunning() {
		t.Fatal("expected recording to be stopped after Stop")
	}

	gst.mu.Lock()
	stale := gst.cmd != nil || gst.done != nil || gst.paused
	gst.mu.Unlock()
	if stale {
		t.Fatalf("gstLauncher state was not cleared after the process exited: cmd=%v done=%v paused=%v",
			gst.cmd != nil, gst.done != nil, gst.paused)
	}

	if err := rec.Start(1, opts); err != nil {
		t.Fatalf("second Start failed (recorder not reusable): %v", err)
	}
	if !rec.IsRunning() {
		t.Fatal("expected second recording to be running")
	}

	if err := rec.Stop(); err != nil {
		if !strings.Contains(err.Error(), "interrupt") {
			t.Fatalf("second Stop failed: %v", err)
		}
	}
	if rec.IsRunning() {
		t.Fatal("expected second recording to be stopped")
	}
}

func TestRecorderRejectsConcurrentStart(t *testing.T) {
	withFakeGstLaunch(t)

	rec := NewGstLauncher()
	opts := RecordingOptions{OutputPath: filepath.Join(t.TempDir(), "out.mp4")}

	if err := rec.Start(1, opts); err != nil {
		t.Fatalf("Start failed: %v", err)
	}
	defer func() {
		_ = rec.Cancel()
	}()

	if err := rec.Start(1, opts); err == nil {
		t.Fatal("expected second concurrent Start to fail")
	} else if !strings.Contains(err.Error(), "recording already active") {
		t.Fatalf("unexpected error: %v", err)
	}
}
