// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FunQuiz is Ownable {
    using Counters for Counters.Counter;

    struct GameResult {
        address player;
        uint256 score;
        uint256 questionsAttempted;
        uint256 questionsCorrect;
        uint256 timestamp;
    }

    uint256 public gameFee = 0.01 ether;
    uint256 public recordFee = 0.0001 ether;
    uint256 public rewardAmount = 0.5 ether;

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
    event RewardClaimed(address indexed player, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    function setRewardAmount(uint256 _newAmount) external onlyOwner {
        rewardAmount = _newAmount;
    }

    function setGameFee(uint256 _newFee) external onlyOwner {
        gameFee = _newFee;
    }

    function setRecordFee(uint256 _newFee) external onlyOwner {
        recordFee = _newFee;
    }

    function payToStartGame() external payable {
        require(msg.value == gameFee, "FunQuiz: Incorrect game fee.");
        emit GameStarted(msg.sender, block.timestamp);
    }

    function recordGameResult(
        uint256 _score,
        uint256 _questionsCorrect,
        uint256 _questionsAttempted
    ) external payable {
        require(msg.value == recordFee, "FunQuiz: Incorrect record fee.");
        require(_questionsAttempted > 0, "FunQuiz: Must attempt at least one question.");

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

    function claimReward() external {
        require(address(this).balance >= rewardAmount, "FunQuiz: Not enough STT in contract.");

        (bool success, ) = msg.sender.call{value: rewardAmount}("");
        require(success, "FunQuiz: STT transfer failed.");

        emit RewardClaimed(msg.sender, rewardAmount);
    }

    /// @notice Withdraw entire balance to owner
    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "FunQuiz: No balance to withdraw.");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "FunQuiz: Withdraw failed.");

        emit Withdrawn(owner(), balance);
    }

    /// @notice Withdraw specific amount to owner
    function withdrawPartial(uint256 amount) external onlyOwner {
        require(amount > 0, "FunQuiz: Amount must be greater than 0");
        require(address(this).balance >= amount, "FunQuiz: Insufficient contract balance");

        (bool success, ) = owner().call{value: amount}("");
        require(success, "FunQuiz: Partial withdraw failed.");

        emit Withdrawn(owner(), amount);
    }

    receive() external payable {}
    fallback() external payable {}
}
