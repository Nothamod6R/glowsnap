package screencast

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Settings struct {
	Microphone string `json:"microphone"`
}

func settingsFilePath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(home, ".config", "glowsnap")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	return filepath.Join(dir, "settings.json"), nil
}

func LoadSettings() Settings {
	var s Settings
	path, err := settingsFilePath()
	if err != nil {
		return s
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return s
	}
	if json.Unmarshal(data, &s) != nil {
		return Settings{}
	}
	return s
}

func SaveSettings(s Settings) error {
	path, err := settingsFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

func SaveMicrophone(name string) error {
	settings := LoadSettings()
	settings.Microphone = name
	return SaveSettings(settings)
}

func (s *ScreenCastService) GetSavedMicrophone() string {
	return LoadSettings().Microphone
}
