"""The Test Run checklist. Run: python3 build_testrun.py"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_guidebook as B  # noqa: E402
import test_run  # noqa: E402

if __name__ == '__main__':
    B.book(os.path.join(HERE, 'Test-Run-Checklist.pdf'), 'The Test Run', 'The Hollow Heir · Test Run',
           'One full campaign with two phones, before game night',
           'Tick every box. Write down anything that breaks. Nothing new gets added, only fixes.',
           [test_run])
