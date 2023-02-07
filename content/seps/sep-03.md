---
sep: 0003
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
Wrap Hashflow contracts to support fungible token trades and swap licenses to reduce competitive commercial applications

## Abstract:
The Trader contract wraps Hashflow's RFQ-based router contracts, enabling:
* users can trade tokens intra-chain (ERC20 & native)
* users can trade tokens cross-chain (ERC20 & native)
* contract owners can charge a fee on trades

The BSL-1.1 license prohibits productive use of the licensed work for a period of four years without an Additional Use Grant.

## Specification:
Interface with the Hashflow router contracts as defined at https://docs.hashflow.com/hashflow/taker/getting-started.

Configuration parameters:
* Fee (set in basis points)
* Fee Recipient (the address that receives the fee)
* Router: the address of Hashflow's router contract

Important notes:
* The fee is charged in the base token
* the market taker pays the fee on top of the base trade that executes via Hashflow
* anyone can sweep fees from the Trader contract to the fee recipient at any time
* the contract owner can change contract configuration parameters at any time

## Motivation
This trading contract will enable the DAO to facilitate trading and gate the use of its contracts.

## Copyright
Soft DAO 2023
