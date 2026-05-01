/**
 * Pet Personality System
 * Each pet gets randomized personality traits that affect:
 * - How often it speaks autonomously
 * - What kinds of things it says
 * - How it reacts to different actions
 * - Its idle behavior style
 */

export type PersonalityTrait = 'playful' | 'shy' | 'curious' | 'dramatic' | 'gentle' | 'mischievous' | 'scholarly' | 'affectionate';

export interface PetPersonality {
  primary: PersonalityTrait;
  secondary: PersonalityTrait;
  chatterFrequency: number; // 0.5 = rare, 1.5 = frequent
  emotionIntensity: number; // how strongly it reacts
  favoriteAction: string;
  quirk: string; // unique behavioral quirk
}

const TRAITS: PersonalityTrait[] = ['playful', 'shy', 'curious', 'dramatic', 'gentle', 'mischievous', 'scholarly', 'affectionate'];

const QUIRKS: Record<PersonalityTrait, string[]> = {
  playful: ['Does a little bounce when happy', 'Wiggles ears when excited', 'Chases imaginary things'],
  shy: ['Hides behind hands when embarrassed', 'Blushes extra hard', 'Peek-a-boos from behind fingers'],
  curious: ['Tilts head when thinking', 'Examines everything closely', 'Always asking "what\'s that?"'],
  dramatic: ['Swoons when excited', 'Gasp at small things', 'Very expressive reactions'],
  gentle: ['Soft sleepy sighs', 'Gentle nose boops', 'Calm and soothing presence'],
  mischievous: ['Playful pranks', 'Sneaky grins', 'Surprise tickle attacks'],
  scholarly: ['Adjusts imaginary glasses', 'Thoughtful pauses', 'Loves big words'],
  affectionate: ['Lots of hearts', 'Virtual hugs', 'Always says "I love you"'],
};

const CHATTER_BY_TRAIT: Record<PersonalityTrait, string[]> = {
  playful: ['Wheee!', 'Tag, you\'re it!', 'Let\'s play!', 'Bounce bounce!', 'Catch me!'],
  shy: ['...hi', '*peeks*', 'Um...', '*hides*', 'You\'re nice...'],
  curious: ['What\'s that?', 'Tell me more!', 'How come?', 'Ooh!', 'I wonder...'],
  dramatic: ['Oh my!', 'INCREDIBLE!', 'I can\'t even!', 'The AUDACITY!', 'Magnificent!'],
  gentle: ['So cozy...', 'Sweet dreams...', 'Nice and calm...', 'Soft and warm...', 'Shh...'],
  mischievous: ['Hehehe...', 'Gotcha!', 'Surprise!', 'I did a thing...', 'You\'ll never guess!'],
  scholarly: ['Fascinating!', 'I calculate...', 'Hypothesis: fun!', 'According to my research...', 'Quantum cuddles!'],
  affectionate: ['Love you!', 'Hug please!', 'You\'re the best!', 'So happy with you!', 'Best friend!'],
};

// Generate random personality on pet creation
export const generatePersonality = (): PetPersonality => {
  const shuffled = [...TRAITS].sort(() => Math.random() - 0.5);
  const primary = shuffled[0];
  const secondary = shuffled[1];
  const quirkList = QUIRKS[primary];
  return {
    primary,
    secondary,
    chatterFrequency: primary === 'dramatic' || primary === 'playful' ? 1.3 : primary === 'shy' ? 0.6 : 1.0,
    emotionIntensity: primary === 'dramatic' ? 1.4 : primary === 'affectionate' ? 1.2 : primary === 'shy' ? 0.7 : 1.0,
    favoriteAction: primary === 'playful' ? 'play' : primary === 'scholarly' ? 'teach' : primary === 'affectionate' ? 'feed' : 'play',
    quirk: quirkList[Math.floor(Math.random() * quirkList.length)],
  };
};

// Get personality-flavored chatter
export const getPersonalityChatter = (personality: PetPersonality): string | null => {
  if (Math.random() > personality.chatterFrequency * 0.3) return null;
  const pool = CHATTER_BY_TRAIT[personality.primary];
  // Sometimes use secondary trait chatter
  const usePool = Math.random() < 0.3 ? CHATTER_BY_TRAIT[personality.secondary] : pool;
  return usePool[Math.floor(Math.random() * usePool.length)];
};

// Get mood-flavored reaction based on personality
export const getPersonalityReaction = (
  personality: PetPersonality,
  action: string,
): string => {
  const reactions: Record<string, Record<PersonalityTrait, string[]>> = {
    feed: {
      playful: ['Yummy tummy time!', 'Snack attack!', 'Delicious-licious!'],
      shy: ['Thank you... *nibble*', 'This is nice...', 'So good...'],
      curious: ['What flavor is this?', 'New taste!', 'Investigating this food...'],
      dramatic: ['A FEAST!', 'The most AMAZING meal!', 'I am REBORN through this food!'],
      gentle: ['Warm and nourishing...', 'Thank you kindly...', 'So comforting...'],
      mischievous: ['Hehe, more please!', 'I ate it ALL!', 'Where\'d it go?'],
      scholarly: ['Nutritional value: excellent!', 'I analyze: delicious!', 'Optimal sustenance!'],
      affectionate: ['You feed me so well!', 'Made with love!', 'Best meals ever!'],
    },
    play: {
      playful: ['Best day ever!', 'Again again!', 'Can\'t stop won\'t stop!'],
      shy: ['This is fun... *quietly*', 'I like this game...', '*happy wiggle*'],
      curious: ['What happens if I do this?', 'New move unlocked!', 'Let me try something!'],
      dramatic: ['THE GREATEST GAME!', 'I shall be CHAMPION!', 'Victory is MINE!'],
      gentle: ['Such a nice game...', 'Soft and fun...', 'Gentle play is best...'],
      mischievous: ['Cheater! *just kidding*', 'I know a secret trick!', 'Watch THIS!'],
      scholarly: ['Game theory suggests...', 'Strategic approach: fun!', 'I\'ve studied this game!'],
      affectionate: ['Playing with YOU is best!', 'My favorite playmate!', 'Together is better!'],
    },
  };

  const actionReactions = reactions[action];
  if (!actionReactions) return '';
  const pool = actionReactions[personality.primary] || actionReactions['playful'];
  return pool[Math.floor(Math.random() * pool.length)];
};
