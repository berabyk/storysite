import { getPages } from "@/utils/notion";
import Link from "next/link";

import { StoryCard } from "@/components/StoryCard/StoryCard";
import Container from "@mui/material/Container";
import { Box, Grid } from "@mui/material";

export default async function Home() {
  const page = await getPages();
  const pages = page ? page : [];

  //link
  // href={`/stories/${
  //   (page.properties.Slug as any).rich_text[0].plain_text
  // }`}

  // console.log((pages[0][0].properties.Explanation as any).rich_text[0].plain_text);

  return (
    <main>
      <Grid container spacing={5} justifyContent="center">
        {pages.map((page) => (
          <Grid item xs={12} md={6} key={page!.id}>
            <StoryCard
              image={
                page.properties.BannerImage &&
                (page.properties.BannerImage as any).files[0]
                  ? (page.properties.BannerImage as any).files[0].file.url
                  : "/static/images/cover.jpg"
              }
              title={(page.properties.Title as any).title[0].plain_text}
              createdDate={page.created_time}
              slug={(page.properties.Slug as any).rich_text[0].plain_text}
              explanation={
                (page.properties.Explanation as any).rich_text[0].plain_text
              }
            />
          </Grid>
        ))}
      </Grid>
    </main>
  );
}
