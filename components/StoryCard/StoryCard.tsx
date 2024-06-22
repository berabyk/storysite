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
  createdDate: string;
  slug: string;
  explanation: string;
}

export function StoryCard(props: StoryCardProps) {
  const { image, title, createdDate, slug, explanation } = props;

  return (
    <Card>
      <CardActionArea LinkComponent={Link} href={`stories/${slug}`}>
        <CardMedia
          component="img"
          height="194"
          image={image}
          alt={`image${slug}`}
        />
      </CardActionArea>

      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {explanation}
        </Typography>
      </CardContent>

      <CardActions disableSpacing>
        <IconButton aria-label="add to favorites">
          <BookmarkBorder />
        </IconButton>
        <Button size="small" href={`stories/${slug}`}>
          <AutoStoriesOutlined sx={{ marginRight: "5px" }} /> Oku
        </Button>
      </CardActions>
    </Card>
  );
}
