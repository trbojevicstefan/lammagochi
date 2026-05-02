/** Item crafting & combination system */
import type { GameItem } from './items';

export interface CraftingRecipe {
  id: string;
  name: string;
  icon: string;
  ingredients: string[]; // item IDs
  result: { name:string; description:string; effects:Partial<Record<string,number>>; xpGain:number; };
  minLevel: number;
}

export const RECIPES: CraftingRecipe[] = [
  { id:'happy_meal', name:'Happy Meal', icon:'🍱', ingredients:['milk_bottle','soft_food'], result:{name:'Happy Meal',description:'A delicious combo that makes any pet smile!',effects:{hunger:40,mood:25},xpGain:15}, minLevel:2 },
  { id:'study_session', name:'Study Session', icon:'📖', ingredients:['flash_card','story_book'], result:{name:'Study Session',description:'Intensive learning with flash cards and stories.',effects:{knowledge:15,curiosity:10},xpGain:20}, minLevel:11 },
  { id:'spa_day', name:'Spa Day', icon:'🧖', ingredients:['soap_bubble','brush','water_drop'], result:{name:'Spa Day',description:'Full pampering session!',effects:{hygiene:50,mood:30,energy:10},xpGain:18}, minLevel:6 },
  { id:'adventure_kit', name:'Adventure Kit', icon:'🗺️', ingredients:['toy_block','puzzle_piece'], result:{name:'Adventure Kit',description:'Exploration and puzzle-solving adventure!',effects:{curiosity:25,mood:15},xpGain:15}, minLevel:11 },
  { id:'treat_combo', name:'Treat Combo', icon:'🍪', ingredients:['heart_pat','water_drop'], result:{name:'Treat Combo',description:'Love and hydration — the perfect treat!',effects:{trust:15,mood:10,energy:5},xpGain:10}, minLevel:2 },
  { id:'power_nap', name:'Power Nap', icon:'😴', ingredients:['blanket','heart_pat'], result:{name:'Power Nap',description:'Cozy blanket + gentle pat = perfect nap.',effects:{energy:40,mood:15,trust:5},xpGain:12}, minLevel:2 },
  { id:'wisdom_brew', name:'Wisdom Brew', icon:'🧪', ingredients:['elixir','flash_card'], result:{name:'Wisdom Brew',description:'Elixir-enhanced learning session!',effects:{knowledge:20,curiosity:15,trust:5},xpGain:25}, minLevel:19 },
];

export const findCraftable = (itemIds: string[], level: number): CraftingRecipe[] =>
  RECIPES.filter(r => r.minLevel <= level && r.ingredients.every(i => itemIds.includes(i)));
