/* eslint-disable perfectionist/sort-imports */
import 'src/utils/highlight';

import ReactQuill from 'react-quill';

import {alpha, Theme} from '@mui/material/styles';

import { EditorProps } from './types';
import { StyledEditor } from './styles';
import Toolbar, { formats } from './toolbar';

// ----------------------------------------------------------------------

export default function Editor({
  id = 'minimal-quill',
  error,
  simple = false,
  helperText,
  sx,
  ...other
}: EditorProps) {
  const modules = {
    toolbar: {
      container: `#${id}`,
    },
    history: {
      delay: 500,
      maxStack: 100,
      userOnly: true,
    },
    syntax: true,
    clipboard: {
      matchVisual: false,
    },
  };

  return (
    <>
      <StyledEditor
        sx={{
          ...(error && {
            border: (theme: Theme) => `solid 1px ${theme.palette.error.main}`,
            '& .ql-editor': {
              bgcolor: (theme: Theme) => alpha(theme.palette.error.main, 0.08),
            },
          }),
          ...sx,
        }}
      >
        <Toolbar id={id} simple={simple} />

        <ReactQuill
          modules={modules}
          formats={formats}
          placeholder="Write something awesome..."
          {...other}
        />
      </StyledEditor>

      {helperText && helperText}
    </>
  );
}
