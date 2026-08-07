package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

const AppName = "glowsnap"

var configDirOverride string

func setConfigDir(dir string) { configDirOverride = dir }

type Screenshot struct {
	SaveDir string `json:"saveDir"`
}

type Recording struct {
	SaveDir string `json:"saveDir"`
	Microphone string `json:"microphone"`
}

type Settings struct {
	Screenshot Screenshot `json:"screenshot"`
	Recording  Recording  `json:"recording"`
}

type legacySettings struct {
	Microphone string `json:"microphone"`
}

func DefaultScreenshotSaveDir() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, "Pictures", "Screenshots")
}

func DefaultRecordingSaveDir() string {
	home, _ := os.UserHomeDir()
	if home == "" {
		return "Videos"
	}

	videos := filepath.Join(home, "Videos")
	if d := xdgVideosFromUserDirs(home); d != "" {
		videos = d
	}
	return filepath.Join(videos, "Screencasts")
}

func Defaults() Settings {
	return Settings{
		Screenshot: Screenshot{SaveDir: DefaultScreenshotSaveDir()},
		Recording:  Recording{SaveDir: DefaultRecordingSaveDir()},
	}
}

func configDir() (string, error) {
	if configDirOverride != "" {
		if err := os.MkdirAll(configDirOverride, 0o755); err != nil {
			return "", err
		}
		return configDirOverride, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(home, ".config", AppName)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

func filePath() (string, error) {
	dir, err := configDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "settings.json"), nil
}

func (s Settings) ScreenshotSaveDir() string {
	if s.Screenshot.SaveDir == "" {
		return DefaultScreenshotSaveDir()
	}
	return s.Screenshot.SaveDir
}

func (s Settings) RecordingSaveDir() string {
	if s.Recording.SaveDir == "" {
		return DefaultRecordingSaveDir()
	}
	return s.Recording.SaveDir
}

func Load() Settings {
	def := Defaults()
	path, err := filePath()
	if err != nil {
		return def
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return def
	}

	var stored Settings
	if err := json.Unmarshal(data, &stored); err != nil {
		return def
	}

	if stored.Screenshot.SaveDir == "" {
		stored.Screenshot.SaveDir = def.Screenshot.SaveDir
	}
	if stored.Recording.SaveDir == "" {
		stored.Recording.SaveDir = def.Recording.SaveDir
	}

	if stored.Recording.Microphone == "" {
		var legacy legacySettings
		_ = json.Unmarshal(data, &legacy) 
		stored.Recording.Microphone = legacy.Microphone
	}

	return stored
}

func Save(s Settings) error {
	s = normalize(s)
	path, err := filePath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}

	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

func ResetToDefaults() Settings {
	def := Defaults()
	path, err := filePath()
	if err != nil {
		return def
	}
	_ = os.Remove(path)
	return def
}

func normalize(s Settings) Settings {
	s.Screenshot.SaveDir = normalizeDir(s.Screenshot.SaveDir, DefaultScreenshotSaveDir())
	s.Recording.SaveDir = normalizeDir(s.Recording.SaveDir, DefaultRecordingSaveDir())
	return s
}

func normalizeDir(dir, fallback string) string {
	if dir == "" {
		return fallback
	}
	if dir == "~" {
		home, _ := os.UserHomeDir()
		return home
	}
	if strings.HasPrefix(dir, "~/") {
		home, _ := os.UserHomeDir()
		dir = filepath.Join(home, dir[2:])
	}
	abs, err := filepath.Abs(dir)
	if err != nil {
		return fallback
	}
	return abs
}

func xdgVideosFromUserDirs(home string) string {
	data, err := os.ReadFile(filepath.Join(home, ".config", "user-dirs.dirs"))
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "XDG_VIDEOS_DIR=") {
			continue
		}
		val := strings.TrimSpace(strings.TrimPrefix(line, "XDG_VIDEOS_DIR="))
		val = strings.Trim(val, "\"")
		if val == "" {
			return ""
		}
		if strings.HasPrefix(val, "$HOME") {
			return filepath.Join(home, strings.TrimPrefix(val, "$HOME"))
		}
		return val
	}
	return ""
}
