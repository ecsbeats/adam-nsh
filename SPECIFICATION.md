# Specification for Adam Maritime Intelligence System (AMIS)

## Team

Members:
* Adam Blumenfeld, CEO at CSX Labs
* Sachin Naik, CEO at CRISPAI

Problem: Multi-vessel tracking and analysis sucks. The data is siloed and the analysis is manual. We want to automatically create pipelines to track and analyze the data.

Scope: Collect, Stream, and Analyze.

## Collect

Sources:

* Physical AIS Scanner | Scan AIS data beaconed from nearby ships.
* Auxillary Local AIS Data Source | Provided by Sam
* Global AIS Data | Collected from aisstream.io
* Real-time Imagery | from device camera
* Satellite Imagery Data | Query Maxar's high resolution satellite imagery
* (for now) Synthetic Heat Signatures of Ships | will generate later.
* (if we have time) OSINT search sources for conflict information and other location information

For commercial APIs we can create adapters to query them for the data that we need, or ways to stream in. For Maxar we have a file data source we'll load in.

## Stream

We'll create adapters for different data sources and a simple streaming model. We can store the data in the clickhouse data warehouse.

## Analyze

Users make requests that initiate tool calls to pull more data. There should be a data steward agent that forms clickhouse queries to query the raw data. This can be our key innovation, is the integration step.

We'll use clean-coded minimal APIs at every step to facilitate this (high-throughput simple interface) which will be easily exposable.  

## Plan

We'll work backwards from the interface. We'll create a simple, minimalistic, modern interface with Mapbox as well as a chat interface with support for in-chat cards and multi-modal information. The interface should ONLY display the information neccesary, including a classification banner at the top and the bottom.

In parellel we'll work on the physical AIS scanner with the SDR we picked up. =

Then we'll work on the connection to all of the data sources and the importing of different data sources to Clickhouse, and we'll work on some simple queries of the data (and consolidation if we have time) to see what we are working with.

Afer, we can create an agent that is able to generate Clickhouse queries. We'll use either DSPy or LLaMA Index. Then we'll create an API (possibly use MCP) to request the required data. We can even use RL if we have time.

The meat of everything will be in this agentic setup and the local imagery/ais integration, and that will be the most novel part of our application, so we will keep the data collection and interface (pretty BS) as simple as possible.
