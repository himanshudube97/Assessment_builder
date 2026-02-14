/**
 * useFlowTour Hook
 * Manages the interactive tour for the flow editor using Driver.js
 */

import { useEffect, useCallback, useState } from 'react';
import { driver, type Driver, type Config } from 'driver.js';

const TOUR_STORAGE_KEY = 'flowform-tour-completed';

export function useFlowTour() {
  const [driverObj, setDriverObj] = useState<Driver | null>(null);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  // Check if user has completed the tour
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    setHasCompletedTour(completed === 'true');
  }, []);

  // Initialize driver.js
  useEffect(() => {
    const driverConfig: Config = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      popoverClass: 'flowform-tour-popover',
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Done! 🎉',
      steps: [
        {
          element: '.flow-canvas-wrapper',
          popover: {
            title: 'Welcome to the Flow Editor! 👋',
            description: 'Build powerful assessments with branching logic and conditional paths. Let\'s take a quick tour!',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '[data-tour="add-question-btn"]',
          popover: {
            title: 'Add Questions',
            description: 'Click here to add questions or end screens to your assessment. You can choose from 10+ question types!',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="start-node"]',
          popover: {
            title: 'Start Node',
            description: 'Every assessment begins here. This is what your respondents see first. Edit it in the right panel when selected.',
            side: 'right',
            align: 'center',
          },
        },
        {
          element: '[data-tour="node-connect-hint"]',
          popover: {
            title: 'Connect Nodes',
            description: 'Hover over any node and click the <strong>+</strong> button to create connections. This is how you build your flow!',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="auto-arrange-btn"]',
          popover: {
            title: 'Auto-Arrange',
            description: 'When your flow gets messy, use these tools! <strong>Tidy Up</strong> fixes overlaps, and <strong>Spacing</strong> reorganizes everything beautifully.',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '[data-tour="search-btn"]',
          popover: {
            title: 'Search Your Flow',
            description: 'Press <kbd>Ctrl+F</kbd> or click here to search and filter questions by type. Great for large assessments!',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '[data-tour="layout-toggle"]',
          popover: {
            title: 'Layout Direction',
            description: 'Switch between horizontal (left-to-right) and vertical (top-to-bottom) layouts.',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '[data-tour="undo-redo"]',
          popover: {
            title: 'Undo & Redo',
            description: 'Made a mistake? Use <kbd>Ctrl+Z</kbd> to undo and <kbd>Ctrl+Shift+Z</kbd> to redo. Your changes are tracked!',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '.flow-canvas-wrapper',
          popover: {
            title: 'Pro Tips! 💡',
            description: `
              <ul style="margin: 8px 0; padding-left: 20px; text-align: left;">
                <li><strong>Edge Conditions:</strong> Click on connections to add "if-then" logic</li>
                <li><strong>Preview:</strong> Test your flow before publishing</li>
                <li><strong>Drag & Drop:</strong> Organize nodes by dragging them around</li>
                <li><strong>Delete:</strong> Click the trash icon on any node to remove it</li>
              </ul>
            `,
            side: 'bottom',
            align: 'center',
          },
        },
      ],
      onDestroyed: () => {
        // Mark tour as completed when it ends (either finished or skipped)
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        setHasCompletedTour(true);
      },
    };

    const driverInstance = driver(driverConfig);
    setDriverObj(driverInstance);

    return () => {
      driverInstance.destroy();
    };
  }, []);

  // Start the tour
  const startTour = useCallback(() => {
    if (driverObj) {
      driverObj.drive();
    }
  }, [driverObj]);

  // Reset tour completion (for testing or user preference)
  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setHasCompletedTour(false);
  }, []);

  return {
    startTour,
    resetTour,
    hasCompletedTour,
    isReady: !!driverObj,
  };
}
