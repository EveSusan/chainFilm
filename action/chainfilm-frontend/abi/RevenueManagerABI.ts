/* auto-generated */
export const RevenueManagerABI = {
  "abi": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_registry",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
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
          "indexed": false,
          "internalType": "uint256",
          "name": "amountWei",
          "type": "uint256"
        }
      ],
      "name": "Distributed",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "filmId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountWei",
          "type": "uint256"
        }
      ],
      "name": "distributeRevenue",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "filmId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getBalanceHandle",
      "outputs": [
        {
          "internalType": "euint128",
          "name": "",
          "type": "bytes32"
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
      "inputs": [],
      "name": "registry",
      "outputs": [
        {
          "internalType": "contract IFilmRegistryView",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;
