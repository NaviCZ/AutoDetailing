import React, { useState, useEffect } from 'react';

const GitHubUpdates = ({ repoOwner, repoName }) => {
  const [commits, setCommits] = useState([]);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=3`);
        const data = await response.json();
        setCommits(data);
      } catch (error) {
        console.error('Chyba při načítání commitů:', error);
      }
    };

    fetchCommits();
  }, [repoOwner, repoName]);

  const splitCommitMessage = (message) => {
    const parts = message.split(' ');
    const fileName = parts.shift();
    const comment = parts.join(' ');
    return { fileName, comment };
  };

  return (
    <div className="space-y-4 p-4 bg-gray-100 rounded shadow">
      <h2 className="text-sm font-bold">Poslední aktualizace</h2>
      {commits.length > 0 ? (
        <ul className="space-y-2">
          {commits.map(commit => {
            const { fileName, comment } = splitCommitMessage(commit.commit.message);
            const date = new Date(commit.commit.author.date).toLocaleString();
            const author = commit.commit.author.name;
            return (
              <li key={commit.sha} className="border p-2 rounded bg-white shadow-sm">
                <p className="text-xs font-semibold">{fileName}</p>
                <p className="text-xs text-gray-500 mt-1">{comment}</p>
                <p className="text-xs text-gray-500 mt-1">{author} • {date}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm">Žádné aktualizace k zobrazení.</p>
      )}
    </div>
  );
};

export default GitHubUpdates;