// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint128 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

interface IFilmRegistryView {
    function getSplit(uint256 filmId) external view returns (
        address[] memory collaborators,
        uint32[] memory sharesBps,
        bool exists
    );
}

contract RevenueManager is SepoliaConfig {
    IFilmRegistryView public registry;

    // filmId => collaborator => encrypted balance
    mapping(uint256 => mapping(address => euint128)) private balances;

    // withdrawable balances (non-encrypted)
    mapping(uint256 => mapping(address => uint256)) private availableWei; // filmId => user => wei
    mapping(address => uint256) private userAvailableWei; // user => total wei

    event Distributed(uint256 indexed filmId, uint256 amountWei);
    event Withdrawn(uint256 indexed filmId, address indexed user, uint256 amountWei);

    constructor(address _registry) {
        registry = IFilmRegistryView(_registry);
    }

    // Accept ETH and update both encrypted handle and withdrawable balances
    function distributeRevenue(uint256 filmId, uint256 amountWei) public payable {
        require(msg.value == amountWei, "value!=amount");
        (address[] memory cols, uint32[] memory bps, bool exists) = registry.getSplit(filmId);
        require(exists, "film not found");
        require(cols.length == bps.length && cols.length > 0, "bad splits");

        for (uint256 i = 0; i < cols.length; i++) {
            uint256 share = amountWei * bps[i] / 10000;
            euint128 prev = balances[filmId][cols[i]];
            euint128 addend = FHE.asEuint128(uint128(share));
            balances[filmId][cols[i]] = FHE.add(prev, addend);
            FHE.allowThis(balances[filmId][cols[i]]);
            FHE.allow(balances[filmId][cols[i]], cols[i]);

            availableWei[filmId][cols[i]] += share;
            userAvailableWei[cols[i]] += share;
        }

        emit Distributed(filmId, amountWei);
    }

    function getBalanceHandle(uint256 filmId, address user) external view returns (euint128) {
        return balances[filmId][user];
    }

    function getUserAvailable(address user) external view returns (uint256) {
        return userAvailableWei[user];
    }

    function withdraw(uint256 filmId, uint256 amountWei) external {
        require(amountWei > 0, "amount=0");
        uint256 avail = availableWei[filmId][msg.sender];
        require(avail >= amountWei, "insufficient available");
        availableWei[filmId][msg.sender] = avail - amountWei;
        userAvailableWei[msg.sender] -= amountWei;

        (bool ok, ) = msg.sender.call{value: amountWei}("");
        require(ok, "transfer failed");
        emit Withdrawn(filmId, msg.sender, amountWei);
    }

    receive() external payable {}
}



