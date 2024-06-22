import { Divider, Grid } from "@mui/material";
import { StoryCard } from "../StoryCard/StoryCard";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import Image from "next/image";
import ProfileSection from "./ProfileSection";

interface CharacterProps {
  characterName: string;
  bannerImage: string;
  content: string;
  stories: PageObjectResponse[];
  kind: string;
}

export default function CharacterInfo(props: CharacterProps) {
  const { characterName, bannerImage, content, stories, kind } = props;
  return (
    <div>
      <ProfileSection characterName={characterName} bannerImage={bannerImage} kind={kind} />
      <Divider sx={{marginTop:"20px", marginBottom:"20px"}}/>
      <Grid container spacing={5} justifyContent="center">
        <Grid
          item
          xs={12}
          md={12}
          key={"characterName"}
        >
          {<div dangerouslySetInnerHTML={{ __html: content }}></div>}
        </Grid>
        {stories.length != 0 ? (
          stories.map((story) => (
            <Grid item xs={12} md={6} key={story!.id}>
              <StoryCard
                image={
                  story.properties.BannerImage &&
                  (story.properties.BannerImage as any).files[0]
                    ? (story.properties.BannerImage as any).files[0].file.url
                    : "/static/images/cover.jpg"
                }
                title={(story.properties.Title as any).title[0].plain_text}
                createdDate={story.created_time}
                slug={(story.properties.Slug as any).rich_text[0].plain_text}
                explanation={
                  (story.properties.Explanation as any).rich_text[0].plain_text
                }
              />
            </Grid>
          ))
        ) : (
          <div>Hikaye Yok</div>
        )}
      </Grid>
    </div>
  );
}
