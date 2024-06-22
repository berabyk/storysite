import Image from "next/image";

interface PostProps {
  title: string;
  bannerImage: string;
  content: string;
}

export function Post(props: PostProps) {
  const { title, content, bannerImage } = props;

  return (
    <div className="w-full mb-10 flex flex-col items-center pt-20 storyText">
      <h1 className="text-6xl font-black text-white mb-8">{title}</h1>
      {bannerImage != null ? (
        <Image
          alt="Blog Image"
          src={bannerImage}
          width={1920}
          height={1080}
          style={{ width: "100%", height: "20vw", objectFit: "cover" }}
        />
      ) : (
        <div></div>
      )}
      <div
        className="text-xl mt-4 max-w-3xl leading-10 prose prose-p:text-white prose-headings:text-white"
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
    </div>
  );
}
