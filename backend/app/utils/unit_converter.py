"""Unit conversion utilities."""


class UnitConverter:
    """Handles unit conversions for weight and distance."""

    # Weight conversions
    KG_TO_LBS = 2.20462
    LBS_TO_KG = 0.453592

    # Distance conversions
    KM_TO_MILES = 0.621371
    MILES_TO_KM = 1.60934

    @classmethod
    def convert_weight(cls, value: float, from_unit: str, to_unit: str) -> float:
        """Convert weight between kg and lbs.

        Args:
            value: The weight value to convert
            from_unit: Source unit (kg or lbs)
            to_unit: Target unit (kg or lbs)

        Returns:
            Converted weight value, rounded to 1 decimal place
        """
        from_unit = from_unit.lower()
        to_unit = to_unit.lower()

        if from_unit == to_unit:
            return value

        if from_unit == "kg" and to_unit == "lbs":
            return round(value * cls.KG_TO_LBS, 1)
        elif from_unit == "lbs" and to_unit == "kg":
            return round(value * cls.LBS_TO_KG, 1)
        else:
            raise ValueError(f"Cannot convert weight from {from_unit} to {to_unit}")

    @classmethod
    def convert_distance(cls, value: float, from_unit: str, to_unit: str) -> float:
        """Convert distance between km and miles.

        Args:
            value: The distance value to convert
            from_unit: Source unit (km or miles)
            to_unit: Target unit (km or miles)

        Returns:
            Converted distance value, rounded to 1 decimal place
        """
        from_unit = from_unit.lower()
        to_unit = to_unit.lower()

        if from_unit == to_unit:
            return value

        if from_unit == "km" and to_unit == "miles":
            return round(value * cls.KM_TO_MILES, 1)
        elif from_unit == "miles" and to_unit == "km":
            return round(value * cls.MILES_TO_KM, 1)
        else:
            raise ValueError(f"Cannot convert distance from {from_unit} to {to_unit}")

    @classmethod
    def normalize_weight(
        cls, value: float, unit: str, target_unit: str = "kg"
    ) -> float:
        """Normalize weight to a target unit (default kg)."""
        return cls.convert_weight(value, unit, target_unit)

    @classmethod
    def normalize_distance(
        cls, value: float, unit: str, target_unit: str = "km"
    ) -> float:
        """Normalize distance to a target unit (default km)."""
        return cls.convert_distance(value, unit, target_unit)
