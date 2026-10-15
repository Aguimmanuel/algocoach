"""Execute only fixed, developer-authored curriculum code; never user input."""
import contextlib
import io
import json
from pathlib import Path
import unittest
PLANS=json.loads((Path(__file__).resolve().parents[2]/'src/data/teachingPlans.json').read_text())
class TeachingExamples(unittest.TestCase):
    pass
for lesson,plan in PLANS.items():
    def check(self,plan=plan):
        output=io.StringIO()
        with contextlib.redirect_stdout(output):
            exec(compile(plan['code'],'authored-lesson','exec'),{})
        self.assertEqual(output.getvalue().strip(),plan['expected'])
    setattr(TeachingExamples,'test_'+lesson.replace('-','_'),check)
if __name__=='__main__':unittest.main()
