# Specification

## bq-public-dataset-query

**Scenario**: Extracting GitHub commit velocity.

- **GIVEN** a target domain/organization
- **WHEN** the BigQuery service requests data from `githubarchive`
- **THEN** it strictly applies a 30-day `_PARTITIONTIME` bound
- **AND** returns the aggregated event count safely.

**Scenario**: Extracting CrUX web performance.

- **GIVEN** a target domain
- **WHEN** queried against `chrome-ux-report`
- **THEN** it retrieves the latest month's LCP and CLS metrics for the origin.

## custom-search-proxy

**Scenario**: Fetching indexation size.

- **GIVEN** a target domain (e.g., `example.com`)
- **WHEN** the custom search proxy requests `site:example.com`
- **THEN** it parses the `searchInformation.totalResults` field from the response
- **AND** returns it as the proxy SEO presence score.
