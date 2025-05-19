// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FunQuizReward {
    address public owner;
    mapping(address => uint) public claimCount;

    event Received(address indexed from, uint amount);
    event RewardClaimed(address indexed user, uint amount, uint totalClaims);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // allow contract to receive STT (native token)
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }


    function fundContract() external payable onlyOwner {
        emit Received(msg.sender, msg.value);
    }


    function claimReward() external {
        require(claimCount[msg.sender] < 5, "Claim limit reached");
        require(address(this).balance >= 1 ether, "Insufficient STT balance");

        claimCount[msg.sender] += 1;
        payable(msg.sender).transfer(1 ether);
        emit RewardClaimed(msg.sender, 1 ether, claimCount[msg.sender]);
    }


    function withdrawAll() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }


    function contractBalance() external view returns (uint) {
        return address(this).balance;
    }
}
