# Background

A newly released paper has proposed that many mathematical functions can be derived by repeated binary tree applications of the function `eml(x,y) = exp(x)− ln(y)`

# Research paper

For efficiency, the paper has been converted to Markdown and saved in this repo in the directory `reference`.

It is possible that formatting errors have been made in the PDF to Markdown conversion, and images will not be present.

# Goal

Build a browser-based "EML Calculator" which:
* provides the UX described in this document
* performs all actual calculations using the EML method in the linked paper
* displays results of BOTH the EML method and the standard math library functions
* in later stages, provides a visual rendering of the tree of EML calls used for the EML calculation

# System design

## Build output

The resulting artifact should be a self-contained Docker image which hosts a webapp

## Technology stack

* This should use React/Typescript for frontend in the browser
* There should be NO backend services

# UX

## MVP

The interface should show:

1. A traditional scientific calculator interface which:
 * has a number keypad
 * has traditionally large basic arithmetic operator keys (plu, minus, multiply, divide, equals)
 * has traditionally smaller buttons for more advanced operations
 * a display for the input and (eml) output of the calculator
 * a second display for the output using standard math libraries
  * there should be no way to input onto this display, it is for answers only and should clear when a new input is being entered
 * the calculator should be fully functional and responsive

