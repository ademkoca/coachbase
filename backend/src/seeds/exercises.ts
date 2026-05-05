import 'dotenv/config'
import { db, pool } from '../db/client.js'
import { exercises } from '../db/schema.js'

const EXERCISES = [
  // Chest - Strength
  { name: 'Bench Press', muscleGroup: 'chest', category: 'strength' },
  { name: 'Incline Bench Press', muscleGroup: 'chest', category: 'strength' },
  { name: 'Decline Bench Press', muscleGroup: 'chest', category: 'strength' },
  { name: 'Dumbbell Fly', muscleGroup: 'chest', category: 'strength' },
  { name: 'Cable Crossover', muscleGroup: 'chest', category: 'strength' },
  { name: 'Push Up', muscleGroup: 'chest', category: 'strength' },
  { name: 'Dips', muscleGroup: 'chest', category: 'strength' },
  // Back - Strength
  { name: 'Deadlift', muscleGroup: 'back', category: 'strength' },
  { name: 'Pull Up', muscleGroup: 'back', category: 'strength' },
  { name: 'Barbell Row', muscleGroup: 'back', category: 'strength' },
  { name: 'Dumbbell Row', muscleGroup: 'back', category: 'strength' },
  { name: 'Lat Pulldown', muscleGroup: 'back', category: 'strength' },
  { name: 'Seated Cable Row', muscleGroup: 'back', category: 'strength' },
  { name: 'T-Bar Row', muscleGroup: 'back', category: 'strength' },
  { name: 'Face Pull', muscleGroup: 'back', category: 'strength' },
  // Legs - Strength
  { name: 'Squat', muscleGroup: 'legs', category: 'strength' },
  { name: 'Front Squat', muscleGroup: 'legs', category: 'strength' },
  { name: 'Leg Press', muscleGroup: 'legs', category: 'strength' },
  { name: 'Romanian Deadlift', muscleGroup: 'legs', category: 'strength' },
  { name: 'Lunges', muscleGroup: 'legs', category: 'strength' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'legs', category: 'strength' },
  { name: 'Leg Extension', muscleGroup: 'legs', category: 'strength' },
  { name: 'Leg Curl', muscleGroup: 'legs', category: 'strength' },
  { name: 'Calf Raises', muscleGroup: 'legs', category: 'strength' },
  { name: 'Hip Thrust', muscleGroup: 'legs', category: 'strength' },
  // Shoulders - Strength
  { name: 'Overhead Press', muscleGroup: 'shoulders', category: 'strength' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders', category: 'strength' },
  { name: 'Lateral Raise', muscleGroup: 'shoulders', category: 'strength' },
  { name: 'Front Raise', muscleGroup: 'shoulders', category: 'strength' },
  { name: 'Rear Delt Fly', muscleGroup: 'shoulders', category: 'strength' },
  { name: 'Arnold Press', muscleGroup: 'shoulders', category: 'strength' },
  { name: 'Upright Row', muscleGroup: 'shoulders', category: 'strength' },
  // Arms - Strength
  { name: 'Barbell Curl', muscleGroup: 'arms', category: 'strength' },
  { name: 'Dumbbell Curl', muscleGroup: 'arms', category: 'strength' },
  { name: 'Hammer Curl', muscleGroup: 'arms', category: 'strength' },
  { name: 'Preacher Curl', muscleGroup: 'arms', category: 'strength' },
  { name: 'Tricep Pushdown', muscleGroup: 'arms', category: 'strength' },
  { name: 'Skull Crusher', muscleGroup: 'arms', category: 'strength' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'arms', category: 'strength' },
  { name: 'Close Grip Bench Press', muscleGroup: 'arms', category: 'strength' },
  { name: 'Concentration Curl', muscleGroup: 'arms', category: 'strength' },
  // Core - Strength
  { name: 'Plank', muscleGroup: 'core', category: 'strength' },
  { name: 'Crunch', muscleGroup: 'core', category: 'strength' },
  { name: 'Sit Up', muscleGroup: 'core', category: 'strength' },
  { name: 'Russian Twist', muscleGroup: 'core', category: 'strength' },
  { name: 'Leg Raise', muscleGroup: 'core', category: 'strength' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'core', category: 'strength' },
  { name: 'Cable Crunch', muscleGroup: 'core', category: 'strength' },
  { name: 'Side Plank', muscleGroup: 'core', category: 'strength' },
  { name: 'Mountain Climbers', muscleGroup: 'core', category: 'plyometric' },
  // Cardio
  { name: 'Running', muscleGroup: 'cardio', category: 'cardio' },
  { name: 'Cycling', muscleGroup: 'cardio', category: 'cardio' },
  { name: 'Rowing Machine', muscleGroup: 'cardio', category: 'cardio' },
  { name: 'Jump Rope', muscleGroup: 'cardio', category: 'cardio' },
  { name: 'Elliptical', muscleGroup: 'cardio', category: 'cardio' },
  { name: 'Stair Climber', muscleGroup: 'cardio', category: 'cardio' },
  { name: 'Swimming', muscleGroup: 'cardio', category: 'cardio' },
  // Plyometric
  { name: 'Box Jump', muscleGroup: 'legs', category: 'plyometric' },
  { name: 'Burpee', muscleGroup: 'cardio', category: 'plyometric' },
  { name: 'Jump Squat', muscleGroup: 'legs', category: 'plyometric' },
  { name: 'Broad Jump', muscleGroup: 'legs', category: 'plyometric' },
  { name: 'Medicine Ball Slam', muscleGroup: 'core', category: 'plyometric' },
  { name: 'Lateral Bound', muscleGroup: 'legs', category: 'plyometric' },
  // Flexibility
  { name: 'Hip Flexor Stretch', muscleGroup: 'legs', category: 'flexibility' },
  { name: 'Hamstring Stretch', muscleGroup: 'legs', category: 'flexibility' },
  { name: 'Chest Stretch', muscleGroup: 'chest', category: 'flexibility' },
  { name: 'Shoulder Stretch', muscleGroup: 'shoulders', category: 'flexibility' },
  { name: 'Lat Stretch', muscleGroup: 'back', category: 'flexibility' },
  { name: 'Pigeon Pose', muscleGroup: 'legs', category: 'flexibility' },
  { name: 'Foam Rolling Quads', muscleGroup: 'legs', category: 'flexibility' },
  { name: 'Foam Rolling Back', muscleGroup: 'back', category: 'flexibility' },
  // Olympic / Full Body
  { name: 'Clean and Jerk', muscleGroup: 'back', category: 'strength' },
  { name: 'Snatch', muscleGroup: 'back', category: 'strength' },
  { name: 'Kettlebell Swing', muscleGroup: 'back', category: 'strength' },
  { name: 'Farmers Walk', muscleGroup: 'back', category: 'strength' },
  { name: 'Battle Ropes', muscleGroup: 'cardio', category: 'cardio' },
  { name: 'Sled Push', muscleGroup: 'legs', category: 'plyometric' },
  { name: 'TRX Row', muscleGroup: 'back', category: 'strength' },
  { name: 'TRX Push Up', muscleGroup: 'chest', category: 'strength' },
  { name: 'Resistance Band Pull Apart', muscleGroup: 'shoulders', category: 'strength' },
  { name: 'Wall Sit', muscleGroup: 'legs', category: 'strength' },
]

async function seed() {
  console.log('Seeding exercises...')
  await db
    .insert(exercises)
    .values(EXERCISES.map((e) => ({ ...e, trainerId: null })))
    .onConflictDoNothing()
  console.log(`Seeded ${EXERCISES.length} exercises.`)
  await pool.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
