import type {StudioItem} from './studio-data';
// Deliberately fixed demo estimates, not live marketplace valuations.
export function demoResalePrice(item:StudioItem):number{
 return /sofa|bed|single|wardrobe/i.test(item.type)?600:/chair|lamp/i.test(item.type)?120:280;
}
