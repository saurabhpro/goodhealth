"""Tests for unit converter utilities."""

import pytest

from app.utils.unit_converter import UnitConverter


class TestWeightConversion:
    """Tests for weight conversion."""

    def test_kg_to_lbs(self):
        """Test kg to lbs conversion."""
        result = UnitConverter.convert_weight(10, "kg", "lbs")
        assert result == 22.0  # 10 * 2.20462 ≈ 22.0

    def test_lbs_to_kg(self):
        """Test lbs to kg conversion."""
        result = UnitConverter.convert_weight(22, "lbs", "kg")
        assert result == 10.0  # 22 * 0.453592 ≈ 10.0

    def test_same_unit_kg(self):
        """Test no conversion when units are the same."""
        result = UnitConverter.convert_weight(50, "kg", "kg")
        assert result == 50

    def test_same_unit_lbs(self):
        """Test no conversion when units are the same."""
        result = UnitConverter.convert_weight(100, "lbs", "lbs")
        assert result == 100

    def test_case_insensitive(self):
        """Test case insensitive unit names."""
        result = UnitConverter.convert_weight(10, "KG", "LBS")
        assert result == 22.0

    def test_invalid_units(self):
        """Test invalid unit raises error."""
        with pytest.raises(ValueError):
            UnitConverter.convert_weight(10, "kg", "stones")


class TestDistanceConversion:
    """Tests for distance conversion."""

    def test_km_to_miles(self):
        """Test km to miles conversion."""
        result = UnitConverter.convert_distance(10, "km", "miles")
        assert result == 6.2  # 10 * 0.621371 ≈ 6.2

    def test_miles_to_km(self):
        """Test miles to km conversion."""
        result = UnitConverter.convert_distance(10, "miles", "km")
        assert result == 16.1  # 10 * 1.60934 ≈ 16.1

    def test_same_unit_km(self):
        """Test no conversion when units are the same."""
        result = UnitConverter.convert_distance(42.2, "km", "km")
        assert result == 42.2

    def test_same_unit_miles(self):
        """Test no conversion when units are the same."""
        result = UnitConverter.convert_distance(26.2, "miles", "miles")
        assert result == 26.2

    def test_case_insensitive(self):
        """Test case insensitive unit names."""
        result = UnitConverter.convert_distance(10, "KM", "MILES")
        assert result == 6.2

    def test_invalid_units(self):
        """Test invalid unit raises error."""
        with pytest.raises(ValueError):
            UnitConverter.convert_distance(10, "km", "meters")


class TestNormalization:
    """Tests for normalization helpers."""

    def test_normalize_weight_to_kg(self):
        """Test normalizing weight to kg."""
        result = UnitConverter.normalize_weight(100, "lbs")
        assert result == 45.4  # Converted to kg

    def test_normalize_weight_already_kg(self):
        """Test normalizing weight that's already in kg."""
        result = UnitConverter.normalize_weight(50, "kg")
        assert result == 50

    def test_normalize_distance_to_km(self):
        """Test normalizing distance to km."""
        result = UnitConverter.normalize_distance(10, "miles")
        assert result == 16.1  # Converted to km

    def test_normalize_distance_already_km(self):
        """Test normalizing distance that's already in km."""
        result = UnitConverter.normalize_distance(5, "km")
        assert result == 5
