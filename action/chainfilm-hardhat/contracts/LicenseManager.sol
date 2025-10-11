// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

interface IRevenueManager {
    function distributeRevenue(uint256 filmId, uint256 amountWei) external;
}

contract LicenseManager is SepoliaConfig {
    IRevenueManager public revenue;
    address public feeCollector;
    uint256 public basePriceWei;

    mapping(uint256 => mapping(address => bool)) public licensed; // filmId => user => status

    event Purchased(uint256 indexed filmId, address indexed user, uint256 value);

    constructor(address _revenue, address _feeCollector, uint256 _basePriceWei) {
        revenue = IRevenueManager(_revenue);
        feeCollector = _feeCollector;
        basePriceWei = _basePriceWei;
    }

    function purchaseLicense(uint256 filmId) external payable {
        require(msg.value >= basePriceWei, "insufficient price");
        licensed[filmId][msg.sender] = true;
        // 将 ETH 一并发送给 revenue，由其按分润更新可提现余额与加密余额
        (bool ok, ) = address(revenue).call{value: msg.value}(
            abi.encodeWithSelector(IRevenueManager.distributeRevenue.selector, filmId, msg.value)
        );
        require(ok, "revenue call failed");
        emit Purchased(filmId, msg.sender, msg.value);
        // optional fee split to feeCollector can be added here
    }

    function getLicenseStatus(uint256 filmId, address user) external view returns (bool) {
        return licensed[filmId][user];
    }
}



