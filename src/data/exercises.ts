import type { Equipment, FocusArea, Level } from './options';

export type Unit = 'reps' | 'seconds';

export interface Exercise {
    name: string;
    category: FocusArea;
    // Everything the movement needs. An empty list means bodyweight only.
    equipment: readonly Equipment[];
    primary_muscle: string;
    difficulty: Level;
    // Reps for a movement that is repeated, seconds for a position that is held.
    unit: Unit;
    description: string;
}

export const exercisesData: Exercise[] = [
    {
        "name": "Resistance Band Pull-up",
        "category": "Pull",
        "equipment": ["Resistance Band", "Pull-up Bar"],
        "primary_muscle": "Back",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Loop a resistance band around the bar, place your knees or feet in the loop, and pull yourself up until your head crosses the bar level."
    },
    {
        "name": "Resistance Band Chin-up",
        "category": "Pull",
        "equipment": ["Resistance Band", "Pull-up Bar"],
        "primary_muscle": "Back",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Grip the bar with an underhand grip while using a resistance band for assistance, and pull yourself up."
    },
    {
        "name": "Resistance Band Back Row",
        "category": "Pull",
        "equipment": ["Resistance Band"],
        "primary_muscle": "Back",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Loop a band around a sturdy anchor at waist level, facing it, and pull the band toward your waist."
    },
    {
        "name": "Resistance Band Triceps Extension",
        "category": "Push",
        "equipment": ["Resistance Band"],
        "primary_muscle": "Triceps",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Grab a hanging band with both hands, and stretch your arms at the elbows by activating the triceps."
    },
    {
        "name": "Resistance Band Standing Pull-Over",
        "category": "Pull",
        "equipment": ["Resistance Band"],
        "primary_muscle": "Back",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Stand away from the anchor, lean slightly forward, and pull the ends of the band close to your body."
    },
    {
        "name": "Resistance Band Biceps Curl",
        "category": "Pull",
        "equipment": ["Resistance Band"],
        "primary_muscle": "Biceps",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Grab the band with an underhand grip and pull it toward your shoulder while keeping your elbow stationary."
    },
    {
        "name": "Band-Assisted Push-up",
        "category": "Push",
        "equipment": ["Resistance Band"],
        "primary_muscle": "Chest",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Get into a high plank position with a resistance band, lower your chest toward the ground, and push back up."
    },
    {
        "name": "Push-up",
        "category": "Push",
        "equipment": [],
        "primary_muscle": "Chest",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Start in a high plank with hands shoulder-width apart, lower your body until your chest touches the ground, and push back up."
    },
    {
        "name": "Pull-up",
        "category": "Pull",
        "equipment": ["Pull-up Bar"],
        "primary_muscle": "Lats",
        "difficulty": "Intermediate",
        "unit": "reps",
        "description": "Hang from a bar with an overhand grip, engage your scapula, and pull your body upward until your chin clears the bar."
    },
    {
        "name": "Pistol Squat",
        "category": "Legs",
        "equipment": [],
        "primary_muscle": "Quads",
        "difficulty": "Advanced",
        "unit": "reps",
        "description": "Stand on one leg with the other extended in front of you, lower your body, and push through your heel to return to standing."
    },
    {
        "name": "Muscle-up",
        "category": "Pull",
        "equipment": ["Pull-up Bar"],
        "primary_muscle": "Lats",
        "difficulty": "Advanced",
        "unit": "reps",
        "description": "Pull your body up explosively from a hang, transition over the bar into a dip position, and push yourself up."
    },
    {
        "name": "Handstand",
        "category": "Push",
        "equipment": [],
        "primary_muscle": "Shoulders",
        "difficulty": "Intermediate",
        "unit": "seconds",
        "description": "Place your hands on the ground, kick your legs into an inverted position, and maintain straight arms."
    },
    {
        "name": "L-Sit",
        "category": "Core",
        "equipment": [],
        "primary_muscle": "Abs",
        "difficulty": "Intermediate",
        "unit": "seconds",
        "description": "Sit on the ground or bars, press through your hands to lift your body, and keep your legs straight and parallel to the floor in an L-shape."
    },
    {
        "name": "Back Lever",
        "category": "Pull",
        "equipment": ["Pull-up Bar"],
        "primary_muscle": "Back",
        "difficulty": "Advanced",
        "unit": "seconds",
        "description": "Hang from a bar, rotate your body backward until inverted, and extend your legs until your body is parallel to the ground."
    },
    {
        "name": "One Arm Push-up",
        "category": "Push",
        "equipment": [],
        "primary_muscle": "Chest",
        "difficulty": "Advanced",
        "unit": "reps",
        "description": "Start in a push-up position with one hand beneath your shoulder and the other behind your back, lower your body, and push back up."
    },
    {
        "name": "Front Lever",
        "category": "Pull",
        "equipment": ["Pull-up Bar"],
        "primary_muscle": "Back",
        "difficulty": "Advanced",
        "unit": "seconds",
        "description": "Hang from a bar and lift your body until it is parallel to the ground with your front facing up and your body in a straight line."
    },
    {
        "name": "Freestanding Handstand Push-up",
        "category": "Push",
        "equipment": [],
        "primary_muscle": "Shoulders",
        "difficulty": "Advanced",
        "unit": "reps",
        "description": "Kick into a freestanding handstand, lower your body by bending at the elbows, and push back up."
    },
    {
        "name": "TRX Rows",
        "category": "Pull",
        "equipment": ["TRX"],
        "primary_muscle": "Back",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Stand facing the anchor, lean back with straight arms, and pull yourself back up with your elbows low."
    },
    {
        "name": "Biceps Curl",
        "category": "Pull",
        "equipment": ["Dumbbells"],
        "primary_muscle": "Biceps",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Stand with a dumbbell in each hand and palms facing forward, curl the weights toward your chest."
    },
    {
        "name": "Dumbbell Deadlift",
        "category": "Legs",
        "equipment": ["Dumbbells"],
        "primary_muscle": "Glutes",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Stand with dumbbells in hands, hinge at the hips while bending your knees slightly to lower weights toward the floor, and drive through heels."
    },
    {
        "name": "Goblet Squat",
        "category": "Legs",
        "equipment": ["Dumbbells"],
        "primary_muscle": "Quads",
        "difficulty": "Intermediate",
        "unit": "reps",
        "description": "Hold one dumbbell with both hands at chest height, go down into a squat while keeping your chest upright, then stand."
    },
    {
        "name": "Dumbbell Bench Press",
        "category": "Push",
        "equipment": ["Dumbbells"],
        "primary_muscle": "Chest",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Lie face-up on a bench or floor holding dumbbells, press them upward until arms are fully extended, then lower them slowly."
    },
    {
        "name": "Romanian Deadlift",
        "category": "Legs",
        "equipment": ["Dumbbells"],
        "primary_muscle": "Hamstrings",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Stand holding dumbbells, hinge at the hips with a straight back and slightly bent knees, lower the weights to shins, and stand up."
    },
    {
        "name": "Hip Thrust",
        "category": "Legs",
        "equipment": ["Dumbbells", "Bench"],
        "primary_muscle": "Glutes",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Lie with your upper back on a bench and feet flat, hold a dumbbell securely on your hips, and press through your heels to lift your hips."
    },
    {
        "name": "Dumbbell Overhead Press",
        "category": "Push",
        "equipment": ["Dumbbells"],
        "primary_muscle": "Shoulders",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Hold dumbbells just outside your shoulders, press them straight overhead until arms are fully extended, and gradually lower them back down."
    },
    {
        "name": "Plank",
        "category": "Core",
        "equipment": [],
        "primary_muscle": "Abs",
        "difficulty": "Beginner",
        "unit": "seconds",
        "description": "Start on the floor with forearms flat and elbows under shoulders, extend legs back on toes, and hold your body straight from head to heels."
    },
    {
        "name": "Hollow Holds",
        "category": "Core",
        "equipment": [],
        "primary_muscle": "Abs",
        "difficulty": "Beginner",
        "unit": "seconds",
        "description": "Lie on your back with arms extended overhead, lift your shoulders and legs off the ground a few inches while pressing your lower back into the floor."
    },
    {
        "name": "Inverted Table Row",
        "category": "Pull",
        "equipment": [],
        "primary_muscle": "Back",
        "difficulty": "Intermediate",
        "unit": "reps",
        "description": "Lie under a sturdy, heavy table, grip the edge with both hands, keep your body straight, and pull your chest up to the table edge. Test that the table holds your weight first."
    },
    {
        "name": "Prone Y-T-W Raise",
        "category": "Pull",
        "equipment": [],
        "primary_muscle": "Back",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Lie face down, lift your chest slightly, and raise your arms into a Y, then a T, then a W shape, squeezing your shoulder blades together at each position."
    },
    {
        "name": "Superman Pull-Down",
        "category": "Pull",
        "equipment": [],
        "primary_muscle": "Lats",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Lie face down with arms extended overhead, lift your chest and arms off the floor, then pull your elbows down to your ribs and reach back out."
    },
    {
        "name": "Bodyweight Squat",
        "category": "Legs",
        "equipment": [],
        "primary_muscle": "Quads",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Stand with feet shoulder-width apart, sit your hips back and down until your thighs are parallel to the floor, then drive through your heels to stand."
    },
    {
        "name": "Reverse Lunge",
        "category": "Legs",
        "equipment": [],
        "primary_muscle": "Glutes",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Step one foot back and lower until both knees are bent to about 90 degrees, then push through the front heel to return to standing. Alternate legs."
    },
    {
        "name": "Glute Bridge",
        "category": "Legs",
        "equipment": [],
        "primary_muscle": "Glutes",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Lie on your back with knees bent and feet flat, drive your hips up until your body forms a straight line from shoulders to knees, squeeze, and lower with control."
    },
    {
        "name": "Calf Raise",
        "category": "Legs",
        "equipment": [],
        "primary_muscle": "Calves",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Stand tall, rise onto the balls of your feet as high as you can, pause at the top, and lower slowly. Use a step edge for extra range."
    },
    {
        "name": "Bench Dips",
        "category": "Push",
        "equipment": ["Bench"],
        "primary_muscle": "Triceps",
        "difficulty": "Beginner",
        "unit": "reps",
        "description": "Sit on the edge of a bench with hands beside your hips, slide forward, lower your body by bending your elbows to about 90 degrees, and press back up."
    },
    {
        "name": "Bulgarian Split Squat",
        "category": "Legs",
        "equipment": ["Bench"],
        "primary_muscle": "Quads",
        "difficulty": "Intermediate",
        "unit": "reps",
        "description": "Rest the top of your rear foot on a bench behind you, lower your back knee toward the floor while keeping your torso upright, and drive up through the front heel."
    }
];
