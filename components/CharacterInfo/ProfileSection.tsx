import { Box, Grid, Typography } from "@mui/material";
import Image from "next/image";

interface ProfileProps {
  characterName: string;
  bannerImage: string;
  kind: string;
}

export default function ProfileSection(props: ProfileProps) {
  const { characterName, bannerImage, kind } = props;

  return (
    <>
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={8} sm={6} md={4} textAlign="center">
          <Image
            alt="Blog Image"
            src={bannerImage}
            width={1080}
            height={1080}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Grid>
        <Grid
          container
          item
          xs={12}
          sm={12}
          md={12}
          spacing={1}
          direction="column"
          sx={{ textAlign: { xs: "center", sm: "center" } }}
        >
          <Grid item>
            <Box
              sx={{
                typography: "h2",
                mr: 2,
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              {characterName}
            </Box>
          </Grid>
          <Grid item>
            <Box
              sx={{
                typography: "h6",
                mr: 2,
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              {kind}
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
