---
sep: 0004
title: Trading contracts and licensing
author:  Chris Walker
network: any EVM
comments-uri: https://forum.softdao.ch/t/softprovement-proposal-ideas
type: Request for Enhancement
status: Proposed
created: 2023-02-03T00:00:00.000Z
proposal: Support core primitives for trading tokens on-chain
note: The reference contract wraps Hashflow's trading interface
---

## Simple Summary:
The abstract token standard lets participants move tokens on- and off-chain as desired, enabling high-volume, zero-cost mints while preserving on-chain composability.

## Abstract:
Abstract tokens provide a standard interface on EVM blockchains to:
* Mint tokens off-chain as messages
* Reify tokens on-chain via smart contract
* De-reify tokens back into messages

Abstract tokens can comply with existing standards like ERC20, ERC721, and ERC1155, and are especially suited for token applications like airdrops, receipts, credentials, or new forms of bridging.

## Specification:

```solidity
struct AbstractTokenMessage {
  uint64 chainId; // the chain where the token(s) can be reified
  address implementation; // the contract by which the token(s) can be reified
  address owner; // the address that owns the token(s)
  bytes meta; // application-specific information defining the token(s)
  bytes proof; // application-specific information authorizing the creation of the token(s)
}

enum AbstractTokenMessageStatus {
  invalid, // the token message is rejected by the contract
  valid, // the token message is a valid abstract token
  reified, // the token message has already been reified
  unknown // the token message is not intended for this contract
}

interface IAbstractToken {
  event Reify(AbstractTokenMessage);
  event Dereify(AbstractTokenMessage);

  // transforms token(s) from message to contract
  function reify(AbstractTokenMessage calldata message) external;

  // transforms token(s) from contract to message
  function dereify(AbstractTokenMessage calldata message) external;

  // check abstract token message status: an abstract token message can only be reified if valid and not already reified
  function status(AbstractTokenMessage calldata message)
    external
    view
    returns (AbstractTokenMessageStatus status);

  // unique message identifier
  function messageId(AbstractTokenMessage calldata message) external view returns (bytes32);

  // quantity of tokens in the message
  function amount(AbstractTokenMessage calldata message) external view returns (uint256);

  // reference to further information on the tokens
  function uri(AbstractTokenMessage calldata message) external view returns (string memory);
}

// example abstract token interfaces
interface IAbstractERC20 is IAbstractToken, IERC20, IERC165 {
  // reify the message and then transfer tokens
  function transfer(
    address to,
    uint256 amount,
    AbstractTokenMessage calldata message
  ) external returns (bool);

  // reify the message and then transferFrom tokens
  function transferFrom(
    address from,
    address to,
    uint256 amount,
    AbstractTokenMessage calldata message
  ) external returns (bool);
}

interface IAbstractERC721 is IAbstractToken, IERC721 {
  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes calldata _data,
    AbstractTokenMessage calldata message
  ) external;

  function transferFrom(
    address from,
    address to,
    uint256 tokenId,
    AbstractTokenMessage calldata message
  ) external;
}

interface IAbstractERC1155 is IAbstractToken, IERC1155 {
  function safeTransferFrom(
    address from,
    address to,
    uint256 id,
    uint256 amount,
    bytes calldata data,
    AbstractTokenMessage calldata message
  ) external;

  function safeBatchTransferFrom(
    address from,
    address to,
    uint256[] calldata ids,
    uint256[] calldata amounts,
    bytes calldata data,
    AbstractTokenMessage[] calldata messages
  ) external;
}
```
Implementations can be found at https://github.com/SoftDAO/contracts/pull/4

## Motivation
Blockchain transactions provide decentralized consensus, but some actions only require consensus between a few parties and can be done off-chain at lower cost. After seeing lots of interesting token use cases stymied by high mint costs, we wanted an easy way to use both approaches.

Abstract tokens are standard tokens once reified on-chain and can be handled just like regular tokens. Crypto tools that understand abstract tokens can provide even more functionality. For example:
* Wallets and apps can store abstract token messages and look up the token metadata for a each message to show the user the abstract tokens they hold
* On-chain DeFi primitives can accept token messages as inputs, allowing contracts to compose reification with other primitives like trading or lending.

### Airdrops
Large-scale token distributions often use Merkle proofs to grant tokens to a large number of users in one concise transaction: each user later submits their specific Merkle proof when claiming tokens. This is a great pattern because it minimizes transaction fees for distributors and lets claimants defer transaction fees until desired. But there isn’t a standard way to store the merkle proof or display the claimable tokens!

Abstract tokens provide a standard interface to increase airdrop legibility: the abstract token message includes everything needed for an app to understand the airdrop and help the user claim tokens on-chain.

### Receipts for In-App Actions
Crypto apps can issue an abstract token as a record for every relevant activity, whether that’s completing a bike ride on Strava, attending an Ethereum conference, or summiting a number of local peaks.

Why abstract tokens fit:
* Crypto apps are a sensible place to store app-related abstract token messages
* The funnel from in-app event (e.g. entering a race) to a valuable token (e.g. winning the race) that might use on-chain consensus has an extremely high drop-off, so it only makes sense to issue tokens to represent these events if minting is free.
* Interesting tokens that end up on-chain are a good way to reward users

### Credentials
Identity providers can grant every approved applicant an abstract token encoding their eligibility for various on-chain applications. Then these users can seamlessly interact with compliant DeFi apps — only incurring a gas cost to mint their tokenized credentials as desired.

Why abstract tokens fit:
* DeFi apps sometimes require on-chain credentials
* The compliance provider is already a trusted party, so they can create a proof for abstract token messages using an EIP-712 signature
* Minting credentials directly on-chain is too expensive: abstract tokens let compliance providers mint the credentials as soon as the user is approved, but the user only pays for the mint when the credential is needed for a specific on-chain activity
* Composability allows eligible users to access the app without jumping through any additional hoops on-chain

### Token-specific bridging
De-reification might be useful for an entity providing wrapped assets for cross-chain activities. When a user makes a de-reification request to move tokens from one chain to another (e.g. with a `requestDereify()` method that temporarily locks their tokens), the entity can generate a new abstract token message newMessage. Then anyone can call `dereify(newMessage)` on the old chain and `reify(newMessage)` on the new chain.

In this example, abstract tokens provide some auditability of the flow of funds between chains. Unlike traditional bridges, when abstract tokens are moved from chain A to B, the original tokens on chain A are gone — the bridge on chain A is not “holding” any tokens in a bridge that can later be stolen.

## Copyright
Soft DAO 2023
