import { CharacterCard } from "@/components/CharacterCards/CharacterCard";
import { getCharacterInfo } from "@/utils/notion";
import { Grid } from "@mui/material";

export default async function Characters() {
  const characters = await getCharacterInfo();

  console.log(characters[0].properties);

  return (
    <Grid container spacing={5} justifyContent="center">
      {characters.map((character: any) => (
        <Grid item xs={6} md={4} key={character!.id}>
          <CharacterCard
            image={
              character.properties.Image &&
              (character.properties.Image as any).files[0]
                ? (character.properties.Image as any).files[0].file.url
                : "/static/images/cover.jpg"
            }
            title={(character.properties.Name as any).title[0].plain_text}
            slug={(character.properties.Slug as any).rich_text[0].plain_text}
            explanation={
              (character.properties.Explanation as any).rich_text[0].plain_text
            }
            kind={(character.properties.Kind as any).select.name}
          />
        </Grid>
      ))}
    </Grid>
  );
}
