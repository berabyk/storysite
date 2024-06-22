import CharacterInfo from "@/components/CharacterInfo/CharacterInfo";
import { StoryCard } from "@/components/StoryCard/StoryCard";
import {
  getCharacterPageBySlug,
  getCharacterStories,
  getPageContent,
  notionClient,
} from "@/utils/notion";
import { Grid } from "@mui/material";
import bookmarkPlugin from "@notion-render/bookmark-plugin";
import { NotionRenderer } from "@notion-render/client";
import hljsPlugin from "@notion-render/hljs-plugin";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notFound } from "next/navigation";

export default async function CharacterWithSlug({
  params,
}: {
  params: { slug: string };
}) {
  const character = await getCharacterPageBySlug(params.slug);

  //Redirect to not found page!
  if (!character) notFound();
  console.log((character.properties.Kind as any).select.name);

  const characterName: string = (character.properties.Name as any).title[0]
    .plain_text;

  console.log(characterName);
  const stories = (await getCharacterStories(
    params.slug
  )) as PageObjectResponse[];

  const content = await getPageContent(character.id);

  const notionRenderer = new NotionRenderer({
    client: notionClient,
  });


  notionRenderer.use(hljsPlugin({}));
  notionRenderer.use(bookmarkPlugin(undefined));
  const html = await notionRenderer.render(...content);

  return (
    <CharacterInfo
      characterName={characterName}
      bannerImage={(character.properties.Image as any).files[0].file.url}
      content={html}
      stories={stories}
      kind={(character.properties.Kind as any).select.name}
    ></CharacterInfo>
  );
}
