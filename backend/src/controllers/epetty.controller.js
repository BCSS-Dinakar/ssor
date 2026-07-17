import { fetchEpettyFromApi, searchEpettyCandidate } from '../services/epetty.service.js';

export const searchEpettyCases = async (req, res) => {
  try {
    const {
      candidateName,
      candidatePhone,
      fatherName,
      occupation,
      ecaseNo,
      offdrName,
      offdrMobileNo,
      offrFName,
      offrOccupation,
      psName
    } = req.body;

    const searchInput = {
      candidateName,
      candidatePhone,
      fatherName: fatherName || offrFName,
      occupation: occupation || offrOccupation,
      ecaseNo,
      offdrName,
      offdrMobileNo,
      offrFName,
      offrOccupation,
      psName
    };

    const hasCandidateSearch = candidateName || candidatePhone || fatherName || offrFName || occupation || offrOccupation;
    const customFilters = { ecaseNo, offdrName, offdrMobileNo, offrOccupation, psName };
    const hasCustomFilters = Object.values(customFilters).some(Boolean);

    if (!hasCandidateSearch && !hasCustomFilters) {
      return res.status(400).json({ success: false, message: 'Provide candidate details or ePetty filters.' });
    }

    if (hasCandidateSearch) {
      const result = await searchEpettyCandidate(searchInput);
      return res.status(200).json({ success: true, ...result });
    }

    const matches = await fetchEpettyFromApi(customFilters);
    return res.status(200).json({
      success: true,
      matches,
      matchedSource: matches.length > 0 ? 'ePetty Case' : null,
      priorityLabel: matches.length > 0 ? 'Custom Filter Match' : null
    });
  } catch (error) {
    console.error('[searchEpettyCases Error]', error);
    res.status(500).json({ success: false, message: 'Server error during ePetty search.', error: error.message });
  }
};

export const getEpettyCaseByNumber = async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const matches = await fetchEpettyFromApi({ ecaseNo: caseNumber });

    if (matches.length === 0) {
      return res.status(404).json({ success: false, message: 'ePetty case not found.' });
    }

    res.status(200).json({ success: true, data: matches[0] });
  } catch (error) {
    console.error('[getEpettyCaseByNumber Error]', error);
    res.status(500).json({ success: false, message: 'Server error during ePetty case lookup.', error: error.message });
  }
};
