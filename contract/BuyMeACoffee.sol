// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract BuyACoffee {
    event MemoCreated(address indexed sender, uint256 timestamp, string name, string message);
    event TipsWithdrawn(address indexed owner, uint256 amount);

    struct Memo {
        address sender;
        uint256 timestamp;
        string name;
        string message;
    }

    Memo[] memos;

    address public owner;

    modifier onlyOwner {
        require(msg.sender == owner, "you are not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function buyCoffee(string memory _name, string memory _message) external payable {
        require(msg.value > 0, "can't buy coffee with zeros");

        Memo memory memo = Memo(msg.sender, block.timestamp, _name, _message);

        memos.push(memo);

        emit MemoCreated(msg.sender, block.timestamp, _name, _message);
    }

    function withdrawTips() external onlyOwner {
        uint256 contractBalance = address(this).balance;

        require(contractBalance > 0, "no money to withdraw");

        (bool sent, ) = payable(owner).call{value: contractBalance}("");
        require(sent, "Failed to send Ether");

        emit TipsWithdrawn(owner, contractBalance);
    }

    function getMemos() external view returns (Memo[] memory) {
        return memos;
    }

    function getTipBalance() external view returns (uint256 bal) {
        bal = address(this).balance;
    }

    receive() external payable { }
}