import unittest
import numpy as np
from archive.Taal_AI.scripts.predict import get_features

class TestTaalPipeline(unittest.TestCase):
    def test_feature_shape(self):
        """Test that get_features ALWAYS returns exactly 30 features."""
        # Create 20 seconds of fake random noise (simulating audio)
        fake_audio = np.random.uniform(-1, 1, 22050 * 20)
        
        features = get_features(fake_audio, sr=22050)
        
        # Verify it didn't fail
        self.assertIsNotNone(features, "Feature extraction failed on valid audio array.")
        # Verify it extracted exactly 30 numbers
        self.assertEqual(len(features), 30, f"Expected 30 features, got {len(features)}")

if __name__ == '__main__':
    unittest.main()