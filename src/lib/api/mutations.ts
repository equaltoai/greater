import { getLesserClient } from './graphql-client';

export async function favoriteStatus(id: string) {
  const client = await getLesserClient();
  // Cast to any as method signatures might differ in currently installed version
  return (client as any).favouriteNote(id);
}

export async function unfavoriteStatus(id: string) {
  const client = await getLesserClient();
  // Cast to any as method signatures might differ in currently installed version
  return (client as any).unfavouriteNote(id);
}

export async function boostStatus(id: string) {
  const client = await getLesserClient();
  // Cast to any as method signatures might differ in currently installed version
  return (client as any).reblogNote(id);
}

export async function unboostStatus(id: string) {
  const client = await getLesserClient();
  // Cast to any as method signatures might differ in currently installed version
  return (client as any).unreblogNote(id);
}