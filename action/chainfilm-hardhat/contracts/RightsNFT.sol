// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

interface IERC721Minimal {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
}

contract RightsNFT is IERC721Minimal, SepoliaConfig {
    string public name = "ChainFilm Rights";
    string public symbol = "CFR";

    address public filmRegistry;
    uint256 public nextTokenId;

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;
    mapping(uint256 => string) public tokenURIOf;
    mapping(uint256 => uint256) public filmOf; // tokenId -> filmId

    modifier onlyRegistry() {
        require(msg.sender == filmRegistry, "only registry");
        _;
    }

    constructor(address _filmRegistry) {
        filmRegistry = _filmRegistry;
    }

    function balanceOf(address owner) external view returns (uint256 balance) {
        require(owner != address(0), "zero");
        return _balanceOf[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address owner) {
        owner = _ownerOf[tokenId];
        require(owner != address(0), "not minted");
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "zero");
        require(_ownerOf[tokenId] == address(0), "minted");
        _ownerOf[tokenId] = to;
        _balanceOf[to] += 1;
        emit Transfer(address(0), to, tokenId);
    }

    function mintNFT(uint256 filmId, address to, string memory tokenURI) external onlyRegistry returns (uint256 tokenId) {
        tokenId = ++nextTokenId;
        filmOf[tokenId] = filmId;
        tokenURIOf[tokenId] = tokenURI;
        _mint(to, tokenId);
    }
}





