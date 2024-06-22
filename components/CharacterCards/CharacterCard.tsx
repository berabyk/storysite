import * as React from "react";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import IconButton, { IconButtonProps } from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { AutoStoriesOutlined, BookmarkBorder } from "@mui/icons-material";
import { Button, CardActionArea } from "@mui/material";
import Link from "next/link";

interface StoryCardProps {
  image: string;
  title: string;
  slug: string;
  explanation: string;
  kind: string;
}

export function CharacterCard(props: StoryCardProps) {
  const { image, title, slug, explanation, kind } = props;

  return (
    <Card>
      <CardActionArea LinkComponent={Link} href={`/characters/${slug}`}>
        <CardMedia
          sx={{ aspectRatio: "1/1" }}
          component="img"
          image={image}
          alt={`image${slug}`}
        />
      </CardActionArea>

        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {kind}
          </Typography>
        </CardContent>

      <CardActions disableSpacing>
        <Button size="small" href={`/characters/${slug}`}>
          Karaktere Göz At
        </Button>
      </CardActions>
    </Card>
  );
}
