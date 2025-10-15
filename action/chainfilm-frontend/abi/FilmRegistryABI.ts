/* auto-generated */
export const FilmRegistryABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "filmId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "FilmRegistered",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "films",
      "outputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "ipfsCidMeta",
          "type": "string"
        },
        {
          "internalType": "euint256",
          "name": "videoHashEnc",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "filmId",
          "type": "uint256"
        }
      ],
      "name": "getSplit",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "cols",
          "type": "address[]"
        },
        {
          "internalType": "uint32[]",
          "name": "bps",
          "type": "uint32[]"
        },
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextFilmId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "ipfsCidMeta",
          "type": "string"
        },
        {
          "internalType": "externalEuint256",
          "name": "videoHashHandle",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "proof",
          "type": "bytes"
        },
        {
          "internalType": "address[]",
          "name": "collaborators",
          "type": "address[]"
        },
        {
          "internalType": "uint32[]",
          "name": "sharesBps",
          "type": "uint32[]"
        }
      ],
      "name": "registerFilm",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "filmId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;
