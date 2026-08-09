package screencast

import (
	"os"
	"path/filepath"
	"time"

	"glowsnap/services/settings"
)

func GenerateFilename() string {
	return "screencast_" + time.Now().Format("2006-01-02_15-04-05") + ".mp4"
}

func VideosDir() (string, error) {
	dir := settings.Load().RecordingSaveDir()
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	return dir, nil
}

func NewOutputPath() (string, error) {
	dir, err := VideosDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, GenerateFilename()), nil
}
