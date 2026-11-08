import { useState } from 'react';
import Sidebar from './Sidebar';
import ChannelPanel from './ChannelPanel';
import MessagePanel from './MessagePanel';
import './HomeScreen.css';

function HomeScreen() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const handleSelectWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setSelectedChannelId(null);
  };

  return (
    <div className="home">
      <Sidebar selectedWorkspaceId={selectedWorkspaceId} onSelect={handleSelectWorkspace} />
      {selectedWorkspaceId && (
        <ChannelPanel
          workspaceId={selectedWorkspaceId}
          selectedChannelId={selectedChannelId}
          onSelect={setSelectedChannelId}
        />
      )}
      <main className="home__content">
        {selectedChannelId ? (
          <MessagePanel channelId={selectedChannelId} />
        ) : (
          <p className="home__placeholder">
            {selectedWorkspaceId ? 'Select a channel to start chatting' : 'Select a workspace to get started'}
          </p>
        )}
      </main>
    </div>
  )
}

export default HomeScreen;
