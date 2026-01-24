export type ExerciseType = 'strength' | 'cardio' | 'functional'

interface Equipment {
  name: string
  brands: string[]
  type: ExerciseType
}

export const gymEquipment: Record<string, Equipment[]> = {
  cardio: [
    { name: 'Treadmill', brands: ['Technogym', 'Life Fitness', 'Precor', 'Matrix'], type: 'cardio' },
    { name: 'Elliptical Machine', brands: ['Technogym', 'Life Fitness', 'Precor', 'Matrix'], type: 'cardio' },
    { name: 'Exercise Bike (Upright)', brands: ['Technogym', 'Life Fitness', 'Precor', 'Peloton'], type: 'cardio' },
    { name: 'Recumbent Bike', brands: ['Technogym', 'Life Fitness', 'Precor'], type: 'cardio' },
    { name: 'Rowing Machine', brands: ['Technogym', 'Concept2', 'WaterRower'], type: 'cardio' },
    { name: 'Stair Climber', brands: ['Technogym', 'StairMaster', 'Life Fitness'], type: 'cardio' },
    { name: 'Air Bike', brands: ['Assault', 'Rogue', 'Schwinn'], type: 'cardio' },
    { name: 'Spin Bike', brands: ['Technogym', 'Peloton', 'Keiser'], type: 'cardio' },
    { name: 'Cross Trainer', brands: ['Technogym', 'Life Fitness', 'Matrix'], type: 'cardio' },
  ],

  chestPress: [
    { name: 'Chest Press Machine', brands: ['Technogym', 'Life Fitness', 'Hammer Strength'], type: 'strength' },
    { name: 'Incline Chest Press', brands: ['Technogym', 'Life Fitness', 'Hammer Strength'], type: 'strength' },
    { name: 'Decline Chest Press', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'Pec Fly / Pec Deck', brands: ['Technogym', 'Life Fitness', 'Cybex'], type: 'strength' },
    { name: 'Cable Crossover', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'Smith Machine Bench Press', brands: ['Technogym', 'Life Fitness', 'Hammer Strength'], type: 'strength' },
  ],

  back: [
    { name: 'Lat Pulldown', brands: ['Technogym', 'Life Fitness', 'Hammer Strength'], type: 'strength' },
    { name: 'Seated Row', brands: ['Technogym', 'Life Fitness', 'Hammer Strength'], type: 'strength' },
    { name: 'T-Bar Row', brands: ['Technogym', 'Hammer Strength'], type: 'strength' },
    { name: 'Back Extension', brands: ['Technogym', 'Life Fitness', 'Cybex'], type: 'strength' },
    { name: 'Pull-Up Assist Machine', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'High Row Machine', brands: ['Technogym', 'Hammer Strength'], type: 'strength' },
    { name: 'Low Row Machine', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
  ],

  shoulders: [
    { name: 'Shoulder Press Machine', brands: ['Technogym', 'Life Fitness', 'Hammer Strength'], type: 'strength' },
    { name: 'Lateral Raise Machine', brands: ['Technogym', 'Life Fitness', 'Cybex'], type: 'strength' },
    { name: 'Rear Delt Machine', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'Shoulder Shrug Machine', brands: ['Technogym', 'Hammer Strength'], type: 'strength' },
  ],

  arms: [
    { name: 'Bicep Curl Machine', brands: ['Technogym', 'Life Fitness', 'Cybex'], type: 'strength' },
    { name: 'Tricep Extension Machine', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'Tricep Dip Machine', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'Preacher Curl', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'Cable Bicep Curl', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'Cable Tricep Pushdown', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
  ],

  legs: [
    { name: 'Leg Press', brands: ['Technogym', 'Life Fitness', 'Hammer Strength'], type: 'strength' },
    { name: 'Leg Extension', brands: ['Technogym', 'Life Fitness', 'Cybex'], type: 'strength' },
    { name: 'Leg Curl (Lying)', brands: ['Technogym', 'Life Fitness', 'Hammer Strength'], type: 'strength' },
    { name: 'Leg Curl (Seated)', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'Hack Squat Machine', brands: ['Technogym', 'Hammer Strength'], type: 'strength' },
    { name: 'Smith Machine Squat', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'Calf Raise Machine', brands: ['Technogym', 'Life Fitness', 'Hammer Strength'], type: 'strength' },
    { name: 'Seated Calf Raise', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'Hip Abduction Machine', brands: ['Technogym', 'Life Fitness', 'Cybex'], type: 'strength' },
    { name: 'Hip Adduction Machine', brands: ['Technogym', 'Life Fitness', 'Cybex'], type: 'strength' },
    { name: 'Glute Kickback Machine', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
  ],

  core: [
    { name: 'Ab Crunch Machine', brands: ['Technogym', 'Life Fitness', 'Cybex'], type: 'strength' },
    { name: 'Torso Rotation Machine', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
    { name: 'Roman Chair', brands: ['Technogym', 'Rogue'], type: 'strength' },
    { name: 'Ab Coaster', brands: ['Ab Coaster'], type: 'strength' },
    { name: 'Cable Wood Chop', brands: ['Technogym', 'Life Fitness'], type: 'strength' },
  ],

  freeWeights: [
    { name: 'Barbell Bench Press', brands: [], type: 'strength' },
    { name: 'Barbell Squat', brands: [], type: 'strength' },
    { name: 'Barbell Deadlift', brands: [], type: 'strength' },
    { name: 'Barbell Row', brands: [], type: 'strength' },
    { name: 'Barbell Overhead Press', brands: [], type: 'strength' },
    { name: 'Dumbbell Bench Press', brands: [], type: 'strength' },
    { name: 'Dumbbell Shoulder Press', brands: [], type: 'strength' },
    { name: 'Dumbbell Rows', brands: [], type: 'strength' },
    { name: 'Dumbbell Bicep Curl', brands: [], type: 'strength' },
    { name: 'Dumbbell Lateral Raise', brands: [], type: 'strength' },
    { name: 'Dumbbell Lunges', brands: [], type: 'strength' },
    { name: 'Dumbbell Goblet Squat', brands: [], type: 'strength' },
  ],

  functional: [
    { name: 'TRX Suspension Training', brands: ['TRX'], type: 'functional' },
    { name: 'Kettlebell Swing', brands: [], type: 'functional' },
    { name: 'Battle Ropes', brands: [], type: 'functional' },
    { name: 'Box Jump', brands: [], type: 'functional' },
    { name: 'Medicine Ball Slam', brands: [], type: 'functional' },
    { name: 'Sled Push', brands: ['Rogue', 'Technogym'], type: 'functional' },
    { name: 'Sled Pull', brands: ['Rogue', 'Technogym'], type: 'functional' },
    { name: 'Farmers Walk', brands: [], type: 'functional' },
  ],
}

export const equipmentCategories = [
  { value: 'cardio', label: 'Cardio Machines' },
  { value: 'chestPress', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'legs', label: 'Legs' },
  { value: 'core', label: 'Core / Abs' },
  { value: 'freeWeights', label: 'Free Weights' },
  { value: 'functional', label: 'Functional Training' },
]

// Flatten all equipment into a single searchable array
export const allEquipment = Object.entries(gymEquipment).flatMap(([category, items]) =>
  items.map(item => ({
    ...item,
    category,
    displayName: item.brands.length > 0
      ? `${item.name} (${item.brands.join(', ')})`
      : item.name
  }))
)

// Helper function to get equipment type by name
export function getEquipmentType(name: string): ExerciseType | null {
  const equipment = allEquipment.find(eq => eq.name === name)
  return equipment?.type || null
}
