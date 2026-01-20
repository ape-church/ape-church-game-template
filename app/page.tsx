import { exampleGame } from "@/lib/games";
import ExampleGame from "@/components/example-game/ExampleGame";
// import { GameLeaderboardModal } from "@/components/GameLeaderboardModal";

export async function generateMetadata() {
  return {
    title: exampleGame.title,
    description: exampleGame.description,
  };
}

const ExampleGamePage: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-row mb-2 sm:mb-4">
        <h1 className="text-3xl font-semibold mr-2">
          {exampleGame.title}
        </h1>
        {/* <GameLeaderboardModal
          gameAddress={exampleGame.address}
          gameName={exampleGame.title}
        /> */}
      </div>
      <ExampleGame game={exampleGame} />
    </div>
  );
};

export default ExampleGamePage;