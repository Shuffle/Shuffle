package main

import "testing"

func TestBuildAppImageName(t *testing.T) {
	tests := []struct {
		name          string
		registry      string
		baseImageName string
		appName       string
		appVersion    string
		expected      string
	}{
		{
			name:          "without registry",
			baseImageName: "frikky/shuffle",
			appName:       "http",
			appVersion:    "1.4.0",
			expected:      "frikky/shuffle:http_1.4.0",
		},
		{
			name:          "with registry",
			registry:      "registry.example.com",
			baseImageName: "frikky/shuffle",
			appName:       "custom-app",
			appVersion:    "1.0.0",
			expected:      "registry.example.com/frikky/shuffle:custom-app_1.0.0",
		},
		{
			name:          "with registry path and trailing slash",
			registry:      "registry.example.com/team/",
			baseImageName: "frikky/shuffle",
			appName:       "custom-app",
			appVersion:    "1.0.0",
			expected:      "registry.example.com/team/frikky/shuffle:custom-app_1.0.0",
		},
		{
			name:          "replaces spaces",
			registry:      "registry.example.com",
			baseImageName: "frikky/shuffle",
			appName:       "shuffle tools",
			appVersion:    "1.2.0",
			expected:      "registry.example.com/frikky/shuffle:shuffle-tools_1.2.0",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			actual := buildAppImageName(test.registry, test.baseImageName, test.appName, test.appVersion)
			if actual != test.expected {
				t.Fatalf("expected %q, got %q", test.expected, actual)
			}
		})
	}
}

func TestImageHasRegistryPrefix(t *testing.T) {
	tests := []struct {
		image    string
		expected bool
	}{
		{image: "frikky/shuffle:http_1.4.0", expected: false},
		{image: "registry.example.com/frikky/shuffle:http_1.4.0", expected: true},
		{image: "registry.example.com:5000/frikky/shuffle:http_1.4.0", expected: true},
		{image: "localhost/frikky/shuffle:http_1.4.0", expected: true},
	}

	for _, test := range tests {
		t.Run(test.image, func(t *testing.T) {
			actual := imageHasRegistryPrefix(test.image)
			if actual != test.expected {
				t.Fatalf("expected %v, got %v", test.expected, actual)
			}
		})
	}
}

func TestImageHasLocalRegistryPrefix(t *testing.T) {
	if !imageHasLocalRegistryPrefix("registry.example.com/team/frikky/shuffle:custom-app_1.0.0", "registry.example.com/team/") {
		t.Fatal("expected image to have local registry prefix")
	}

	if imageHasLocalRegistryPrefix("registry.example.com-other/frikky/shuffle:custom-app_1.0.0", "registry.example.com") {
		t.Fatal("did not expect partial registry name to match")
	}
}
