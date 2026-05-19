import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxReviewCommandTemplate,
  getSyncSpecsSkillTemplate,
  getReviewChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '7bc7d1d658975f7916830601fcefed208ed93a4632c96888ad73d321c22b7563',
  getNewChangeSkillTemplate: '5989672758eccf54e3bb554ab97f2c129a192b12bbb7688cc1ffcf6bccb1ae9d',
  getContinueChangeSkillTemplate: 'f2e413f0333dfd6641cc2bd1a189273fdea5c399eecdde98ef528b5216f097b3',
  getApplyChangeSkillTemplate: '3eae6f326b2a230ddf4ba64033ff0434804da6148abfa4b44867eb2c019ba10b',
  getFfChangeSkillTemplate: 'a7332fb14c8dc3f9dec71f5d332790b4a8488191e7db4ab6132ccbefecf9ded9',
  getSyncSpecsSkillTemplate: 'a3df36e37ea267fa197bcfb424a960d0b784354a622228085b13d75029be9e88',
  getOnboardSkillTemplate: 'd189b586fb06c756c280fc412ca52797706d5614f89b3f251ebae6669d0a8d54',
  getOpsxExploreCommandTemplate: 'c312a9a1672295108fb5334f9912357f09e2e7c6c4a5f5dc50acc67ea450aed3',
  getOpsxNewCommandTemplate: '62eee32d6d81a376e7be845d0891e28e6262ad07482f9bfe6af12a9f0366c364',
  getOpsxContinueCommandTemplate: '8bbaedcc95287f9e822572608137df4f49ad54cedfb08d3342d0d1c4e9716caa',
  getOpsxApplyCommandTemplate: '563a5b8669a6cc85e53bdf9492b56b7f193bf4529997236fe24b0ba8d4548298',
  getOpsxFfCommandTemplate: 'cdebe872cc8e0fcc25c8864b98ffd66a93484c0657db94bd1285b8113092702a',
  getArchiveChangeSkillTemplate: '6970ad57a2f556ee90ca8925b89761e9d8916e188b1a59405d49f8f761a0bae8',
  getBulkArchiveChangeSkillTemplate: '10d865d4ab87090d261c3382e68733babfeb0573f1d3e833b4d0fd00de3dde3f',
  getOpsxSyncCommandTemplate: '13b5a6f738420167f2636bde64579aa5160a3115e564e176160103f415030cbe',
  getReviewChangeSkillTemplate: 'f007e3974765e510e3b7e6b956488d736ac6643d5df37bddb6c8545a730d34e5',
  getOpsxArchiveCommandTemplate: 'b800c2899075c3e9a1918c84ab1f79195439442cf3d59c531b47c89f46a61fe5',
  getOpsxOnboardCommandTemplate: 'c60db4e19271f41d533317bc397e7f81b4017d4e036222158204374fc476ef6f',
  getOpsxBulkArchiveCommandTemplate: '3691d27a9e468354f24b0fa9c0c4a96ca8e5f1e9fef081e6a97e99723217d8cb',
  getOpsxReviewCommandTemplate: 'bf3f3b2b9738e977fbd85a412fd326dcc1e4edd62d01d17cec92ebd2d823fdfa',
  getOpsxProposeSkillTemplate: 'e9039921517930924bf5fa47c148c4a156ba382e3b3e1baf56ba9800d6d25682',
  getOpsxProposeCommandTemplate: '3159e297380c0aa5943ffc5babcca5f88f2c0233f137f60823186091c5e4a5ed',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'cd2d763b334cd048ea8e90990d1be2719292ef729df071524fc8d289d4fd336e',
  'openspec-new-change': 'c324a7ace1f244aa3f534ac8e3370a2c11190d6d1b85a315f26a211398310f0f',
  'openspec-continue-change': '463cf0b980ec9c3c24774414ef2a3e48e9faa8577bc8748990f45ab3d5efe960',
  'openspec-apply-change': 'fe62cd140fbbf984ba588003de0814460ad1b1055cdd9d3c67ea2668399bb1a1',
  'openspec-ff-change': '672c3a5b8df152d959b15bd7ae2be7a75ab7b8eaa2ec1e0daa15c02479b27937',
  'openspec-sync-specs': 'ccf33683017f068a5acc4851742b2e59f322171514c4e12be88458df554325ec',
  'openspec-review-change': '71e930ff1ab2f4abd0315c54ea45d4d833a7f669f51e1958adfa7cb5f6429ae3',
  'openspec-archive-change': '35835b9053cd5a937903611bc751171aac7a0629c163691aa1f90b049cb80ad6',
  'openspec-bulk-archive-change': '2ed423c08576852d8cb24025e5803ecc6b7149324a5e018aad83c4dee897a1cc',
  'openspec-onboard': '22e6d8f390547bde5b70c80d8e2946f1d05f598198c34a551c6d8369f0b10b01',
  'openspec-propose': '8a6642e6ebe16df6a31bc541010902a87bdd3a3203da5e5d23fc750f7bc70284',
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('skill templates split parity', () => {
  it('preserves all template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
      getExploreSkillTemplate,
      getNewChangeSkillTemplate,
      getContinueChangeSkillTemplate,
      getApplyChangeSkillTemplate,
      getFfChangeSkillTemplate,
      getSyncSpecsSkillTemplate,
      getOnboardSkillTemplate,
      getOpsxExploreCommandTemplate,
      getOpsxNewCommandTemplate,
      getOpsxContinueCommandTemplate,
      getOpsxApplyCommandTemplate,
      getOpsxFfCommandTemplate,
      getArchiveChangeSkillTemplate,
      getBulkArchiveChangeSkillTemplate,
      getOpsxSyncCommandTemplate,
      getReviewChangeSkillTemplate,
      getOpsxArchiveCommandTemplate,
      getOpsxOnboardCommandTemplate,
      getOpsxBulkArchiveCommandTemplate,
      getOpsxReviewCommandTemplate,
      getOpsxProposeSkillTemplate,
      getOpsxProposeCommandTemplate,
      getFeedbackSkillTemplate,
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    // Intentionally excludes getFeedbackSkillTemplate: skillFactories only models templates
    // deployed via generateSkillContent, while feedback is covered in function payload parity.
    const skillFactories: Array<[string, () => SkillTemplate]> = [
      ['openspec-explore', getExploreSkillTemplate],
      ['openspec-new-change', getNewChangeSkillTemplate],
      ['openspec-continue-change', getContinueChangeSkillTemplate],
      ['openspec-apply-change', getApplyChangeSkillTemplate],
      ['openspec-ff-change', getFfChangeSkillTemplate],
      ['openspec-sync-specs', getSyncSpecsSkillTemplate],
      ['openspec-review-change', getReviewChangeSkillTemplate],
      ['openspec-archive-change', getArchiveChangeSkillTemplate],
      ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['openspec-onboard', getOnboardSkillTemplate],
      ['openspec-propose', getOpsxProposeSkillTemplate],
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });
});
