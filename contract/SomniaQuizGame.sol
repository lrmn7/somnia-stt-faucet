// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SomniaQuizGame is Ownable {
    using Counters for Counters.Counter;

    struct GameResult {
        address player;
        uint256 score;
        uint256 questionsAttempted;
        uint256 questionsCorrect;
        uint256 timestamp;
    }

    uint256 public gameFee = 0.001 ether;
    uint256 public recordFee = 0.0001 ether;

    Counters.Counter private _gameResultIds;
    mapping(uint256 => GameResult) public gameResults;
    mapping(address => uint256[]) public playerGameHistory;

    uint256 public totalGamesPlayed;

    event GameStarted(address indexed player, uint256 timestamp);
    event GameResultRecorded(
        uint256 indexed gameId,
        address indexed player,
        uint256 score,
        uint256 questionsCorrect,
        uint256 questionsAttempted,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    function setGameFee(uint256 _newFee) public onlyOwner {
        gameFee = _newFee;
    }

    function setRecordFee(uint256 _newFee) public onlyOwner {
        recordFee = _newFee;
    }

    function payToStartGame() public payable {
        require(msg.value == gameFee, "SomniaQuizGame: Incorrect game fee.");
        emit GameStarted(msg.sender, block.timestamp);
    }

    function recordGameResult(
        uint256 _score,
        uint256 _questionsCorrect,
        uint256 _questionsAttempted
    ) public payable {
        require(msg.value == recordFee, "SomniaQuizGame: Incorrect record fee.");
        require(_questionsAttempted > 0, "SomniaQuizGame: Must attempt at least one question.");

        _gameResultIds.increment();
        uint256 newGameId = _gameResultIds.current();

        gameResults[newGameId] = GameResult({
            player: msg.sender,
            score: _score,
            questionsCorrect: _questionsCorrect,
            questionsAttempted: _questionsAttempted,
            timestamp: block.timestamp
        });

        playerGameHistory[msg.sender].push(newGameId);
        totalGamesPlayed++;

        emit GameResultRecorded(
            newGameId,
            msg.sender,
            _score,
            _questionsCorrect,
            _questionsAttempted,
            block.timestamp
        );
    }

    function getGameResultById(uint256 _gameId) public view returns (
        address player,
        uint256 score,
        uint256 questionsAttempted,
        uint256 questionsCorrect,
        uint256 timestamp
    ) {
        require(_gameId > 0 && _gameId <= _gameResultIds.current(), "SomniaQuizGame: Invalid game ID.");
        GameResult memory result = gameResults[_gameId];
        return (
            result.player,
            result.score,
            result.questionsAttempted,
            result.questionsCorrect,
            result.timestamp
        );
    }

    function getPlayerGameHistory(address _player) public view returns (uint256[] memory) {
        return playerGameHistory[_player];
    }

    function getTotalGamesPlayed() public view returns (uint256) {
        return totalGamesPlayed;
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "SomniaQuizGame: No balance to withdraw.");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "SomniaQuizGame: Transfer failed.");
    }

    receive() external payable {}
    fallback() external payable {}
}
