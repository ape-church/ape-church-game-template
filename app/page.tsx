import { myGame } from "@/lib/gameConfig";
import MyGameComponent from "@/components/my-game/MyGame";
// import { GameLeaderboardModal } from "@/components/GameLeaderboardModal";

export async function generateMetadata() {
  return {
    title: myGame.title,
    description: myGame.description,
  };
}

const MyGamePage: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-row mb-2 sm:mb-4">
        <h1 className="text-3xl font-semibold mr-2">
          {myGame.title}
        </h1>
        {/* <GameLeaderboardModal
          gameAddress={myGame.address}
          gameName={myGame.title}
        /> */}
      </div>
      <MyGameComponent game={myGame} />
    </div>
  );
};

export default MyGamePage;