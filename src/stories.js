// The branching NPC dialogue tree, instantiated once for the run.
// createStories() closes over this exact S object, which is why reset() clears
// S in place instead of reassigning it.
import { createStories } from './data/dialogue.js';
import { moodTail } from './render/fx.js';
import { S } from './state.js';

export const STORIES = createStories(S, moodTail);
export const STORY_KEYS = Object.keys(STORIES);
