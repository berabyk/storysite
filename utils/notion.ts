import "server-only";

import { Client } from "@notionhq/client";
import { NotionRenderer } from "@notion-render/client";
import {
  BlockObjectResponse,
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { cache } from "react";

export const notionClient = new Client({ auth: process.env.NOTION_TOKEN });

export const getPages = cache(() => {
  console.log(process.env.NOTION_TOKEN);
  console.log(process.env.NOTION_TR_DATABASE_ID!);
  return notionClient.databases
    .query({
      filter: {
        property: "Status",
        select: {
          equals: "Published",
        },
      },
      database_id: process.env.NOTION_TR_DATABASE_ID!,
    })
    .then((res) => res.results as Array<PageObjectResponse> | undefined);
});

export const getPageContent = cache((pageId: string) => {
  return notionClient.blocks.children
    .list({ block_id: pageId })
    .then((res) => res.results as BlockObjectResponse[]);
});

export const getPageBySlug = cache((slug: string) => {
  return notionClient.databases
    .query({
      database_id: process.env.NOTION_TR_DATABASE_ID!,
      filter: {
        property: "Slug",
        rich_text: {
          equals: slug,
        },
      },
    })
    .then((res) => res.results[0] as PageObjectResponse | undefined);
});

export const getCharacterInfo = cache(() => {
  return notionClient.databases
    .query({
      database_id: process.env.NOTION_CHARACTER_TR_DATABASE_ID!,
    })
    .then((res) => ((res as QueryDatabaseResponse).results as any));
});


export const getCharacterPageBySlug = cache((slug: string) => {
  return notionClient.databases
    .query({
      database_id: process.env.NOTION_CHARACTER_TR_DATABASE_ID!,
      filter: {
        property: "Slug",
        rich_text: {
          equals: slug,
        },
      },
    })
    .then((res) => res.results[0] as PageObjectResponse | undefined);
});

//TODO: karakterlerin sayfalarında hangi hikayede yer aldıkları görünecek
export const getCharacterStories = cache((slug: string) => {
  return notionClient.databases
    .query({
      database_id: process.env.NOTION_TR_DATABASE_ID!,
      filter: {
        property: "Characters",
        multi_select: {
          contains: slug,
        },
      },
    })
    .then((res) => res.results as PageObjectResponse[] | undefined);
});

// (res.properties.Characters as any).multi_select.options as MultiSelectPropertyItemObjectResponse | undefined);

// .query({
//   filter: {
//     property: "Characters",
//     multi_select: {
//       contains: "",
//     },
//   },
//   database_id: process.env.NOTION_TR_DATABASE_ID!,
// })
// .then((res) => res.results as Array<PageObjectResponse> | undefined);

// const renderer = new NotionRenderer();

// const { results } = await client.blocks.children.list({
//   block_id: '<page_id>',
// });

// // PartialBlockObjectResponse nesnelerini filtreleyerek, tüm öğelerin BlockObjectResponse olduğundan emin olun
// const blocks = results.filter((result): result is BlockObjectResponse => 'type' in result);

// const html = renderer.render(...blocks);
