import { getPageContent, getPageBySlug, notionClient } from "@/utils/notion";
import { NotionRenderer } from "@notion-render/client";
import { notFound } from "next/navigation";

//Plugins
import hljsPlugin from "@notion-render/hljs-plugin";
import bookmarkPlugin from "@notion-render/bookmark-plugin";
import { Box } from "@mui/material";
import { Post } from "@/components/Post/Post";

export default async function Page({
  params,
}: {
  params: {
    lang: string;
    slug: string;
  };
}) {
  var post: any = "";
  var html: any = "";

  if ((params.lang = "tr")) {
    post = await getPageBySlug(params.slug);

    //Redirect to not found page!
    if (!post) notFound();

    const content = await getPageContent(post.id);

    const notionRenderer = new NotionRenderer({
      client: notionClient,
    });

    notionRenderer.use(hljsPlugin({}));
    notionRenderer.use(bookmarkPlugin(undefined));
    html = await notionRenderer.render(...content);

  } else if ((params.lang = "en")) {
    post = await getPageBySlug(params.slug);

    //Redirect to not found page!
    if (!post) notFound();

    const content = await getPageContent(post.id);

    const notionRenderer = new NotionRenderer({
      client: notionClient,
    });

    notionRenderer.use(hljsPlugin({}));
    notionRenderer.use(bookmarkPlugin(undefined));
    html = await notionRenderer.render(...content);
    // console.log("Post: ", post);
  }

  return (
    <Box>
      <Post
        title={(post.properties.Title as any).title[0].plain_text}
        bannerImage={
          post.properties.BannerImage &&
          (post.properties.BannerImage as any).files[0]
            ? (post.properties.BannerImage as any).files[0].file.url
            : "/static/images/cover.jpg"
        }
        content={html}
      />
    </Box>
  );
}
