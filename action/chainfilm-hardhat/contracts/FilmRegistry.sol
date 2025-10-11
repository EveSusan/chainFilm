// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint256, externalEuint256 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract FilmRegistry is SepoliaConfig {
    struct Film {
        address owner;
        string title;
        string ipfsCidMeta; // public metadata: cover/preview/desc
        euint256 videoHashEnc; // encrypted original video hash (sha256 -> uint256)
        address[] collaborators;
        uint32[] sharesBps; // sum to 10000
        uint256 createdAt;
        bool exists;
    }

    uint256 public nextFilmId;
    mapping(uint256 => Film) public films;

    event FilmRegistered(uint256 indexed filmId, address indexed owner);

    function registerFilm(
        string memory title,
        string memory ipfsCidMeta,
        externalEuint256 videoHashHandle,
        bytes calldata proof,
        address[] memory collaborators,
        uint32[] memory sharesBps
    ) external returns (uint256 filmId) {
        require(collaborators.length == sharesBps.length && collaborators.length > 0, "bad splits");
        uint256 total;
        for (uint256 i = 0; i < sharesBps.length; i++) total += sharesBps[i];
        require(total == 10000, "sum!=10000");

        filmId = ++nextFilmId;

        euint256 encHash = FHE.fromExternal(videoHashHandle, proof);

        films[filmId] = Film({
            owner: msg.sender,
            title: title,
            ipfsCidMeta: ipfsCidMeta,
            videoHashEnc: encHash,
            collaborators: collaborators,
            sharesBps: sharesBps,
            createdAt: block.timestamp,
            exists: true
        });

        // Allow owner to decrypt their film hash; allow contract for later ACL actions
        FHE.allow(films[filmId].videoHashEnc, msg.sender);
        FHE.allowThis(films[filmId].videoHashEnc);

        emit FilmRegistered(filmId, msg.sender);
    }

    // Explicit getter for collaborators and shares because
    // Solidity's auto-generated getter for structs does not expose
    // dynamic array fields in public mappings.
    function getSplit(uint256 filmId)
        external
        view
        returns (address[] memory cols, uint32[] memory bps, bool exists)
    {
        Film storage f = films[filmId];
        return (f.collaborators, f.sharesBps, f.exists);
    }
}



