package screencast
import "glowsnap/services/settings"

func LoadSettings() settings.Settings {
	return settings.Load()
}

func SaveSettings(s settings.Settings) error {
	return settings.Save(s)
}

func SaveMicrophone(name string) error {
	s := settings.Load()
	s.Recording.Microphone = name
	return settings.Save(s)
}

func (s *ScreenCastService) GetSavedMicrophone() string {
	return settings.Load().Recording.Microphone
}
